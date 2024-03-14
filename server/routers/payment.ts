import { router, userProcedure } from '@/app/api/trpc/trpc-router';
import { PLATFORM } from '@/shared/constants/links';
import { SubscriptionWithPriceAndProduct } from '@/shared/models/supscription';
import { getURL } from '@/shared/utils/helpers';
import { stripe } from '@/shared/utils/stripe/config';
import {
  addPaymentMethodIfNotExists,
  checkoutWithStripe,
  createStripePortal,
  getUserStripeCustomerId
} from '@/shared/utils/stripe/server';
import { User } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';
import { z } from 'zod';

const paymentRouter = router({
  createSubscriptionCheckoutSession: userProcedure.mutation(async ({ ctx }) => {
    const user = ctx.session.data.session?.user as User;
    const stripe_product_id = process.env
      .NEXT_PUBLIC_STRIPE_SUBSCRIPTION_PRODUCT_ID as string;

    if (!stripe_product_id) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Stripe product id not found'
      });
    }

    const res = await ctx.supabase
      .from('prices')
      .select('*')
      .eq('id', stripe_product_id)
      .eq('type', 'recurring')
      .single();

    if (res.error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error while getting stripe price'
      });
    }
    const productRow = res.data;
    if (!productRow) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Stripe price not found'
      });
    }

    const { errorRedirect, sessionId } = await checkoutWithStripe(
      productRow,
      PLATFORM.ACCOUNT
    );
    if (errorRedirect) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: errorRedirect
      });
    } else {
      return sessionId as string;
    }
  }),
  createStripePortalLink: userProcedure.mutation(async ({ ctx }) => {
    const user = ctx.session.data.session?.user as User;
    const url = await createStripePortal(
      user,
      `${getURL()}${PLATFORM.ACCOUNT}`
    );
    return url;
  }),
  getSubscriptionStatus: userProcedure.query(async ({ ctx }) => {
    const user = ctx.session.data.session?.user as User;
    const { data } = await ctx.supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .maybeSingle();
    const subscription: SubscriptionWithPriceAndProduct | null = data;
    const subscriptionPrice =
      subscription &&
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: subscription?.prices?.currency!,
        minimumFractionDigits: 0
      }).format((subscription?.prices?.unit_amount || 0) / 100);
    return {
      status: subscription?.status,
      subscriptionPrice,
      isCanceled: subscription?.cancel_at_period_end,
      renewAt: subscription?.current_period_end
    };
  }),
  //
  getUserPaymentMethods: userProcedure.query(async ({ ctx }) => {
    const user = ctx.session.data.session?.user as User;
    const stripeCustomerId = await getUserStripeCustomerId(user);
    if (!stripeCustomerId) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error while creating stripe customer'
      });
    }
    // get the cards
    const cards = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card'
    });
    return cards.data;
  }),
  attachPaymentMethod: userProcedure
    .input(
      z.object({
        payment_method_id: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.data.session?.user as User;
      const stripeCustomerId = await getUserStripeCustomerId(user);
      if (!stripeCustomerId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error while creating stripe customer'
        });
      }
      try {
        const paymentMethod = await addPaymentMethodIfNotExists(
          stripeCustomerId,
          input.payment_method_id
        );
        if (!paymentMethod) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error while attaching payment method'
          });
        }
        return paymentMethod;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error as string
        });
      }
    }),
  detachPaymentMethod: userProcedure
    .input(
      z.object({
        payment_method_id: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.data.session?.user as User;
      const stripeCustomerId = await getUserStripeCustomerId(user);
      if (!stripeCustomerId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error while creating stripe customer'
        });
      }
      const paymentMethod = await stripe.paymentMethods.detach(
        input.payment_method_id
      );
      if (!paymentMethod) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error while detaching payment method'
        });
      }
      return paymentMethod;
    }),
  setDefaultPaymentMethod: userProcedure
    .input(
      z.object({
        payment_method_id: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.data.session?.user as User;
      const stripeCustomerId = await getUserStripeCustomerId(user);
      if (!stripeCustomerId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error while creating stripe customer'
        });
      }
      const customer = await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: input.payment_method_id
        }
      });
      if (!customer) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error while setting default payment method'
        });
      }
      return customer;
    }),
  getDefaultPaymentMethod: userProcedure.query(async ({ ctx }) => {
    const user = ctx.session.data.session?.user as User;
    const stripeCustomerId = await getUserStripeCustomerId(user);
    if (!stripeCustomerId) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error while creating stripe customer'
      });
    }
    const customer = (await stripe.customers.retrieve(
      stripeCustomerId
    )) as Stripe.Customer;
    if (!customer) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error while getting default payment method'
      });
    }
    return customer.invoice_settings.default_payment_method;
  })
});

export default paymentRouter;
