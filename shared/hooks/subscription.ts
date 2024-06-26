import { trpc } from '../utils/trpc/trpc';
import { getStripe } from '../utils/stripe/client';

const useSubscription = () => {
  const chargeAccountPortal =
    trpc.payment.createStripePaymentSession.useMutation();
  const userCredit = trpc.panel.getUserCredit.useQuery();

  const openChargeAccountPortal = () => {
    chargeAccountPortal.mutateAsync().then((url) => {
      document.location.href = url;
    });
  };

  const getSubscription = trpc.payment.getSubscriptionStatus.useQuery();
  const makeCustomerPortal = trpc.payment.createStripePortalLink.useMutation();

  const makeSubsctiptionSession =
    trpc.payment.createSubscriptionCheckoutSession.useMutation();

  const createSubscriptionPortal = () => {
    makeSubsctiptionSession.mutateAsync().then(async (sessionId) => {
      const stripe = await getStripe();
      if (stripe) stripe.redirectToCheckout({ sessionId });
    });
  };
  const openCustomerPortal = () => {
    makeCustomerPortal.mutateAsync().then((url) => {
      document.location.href = url;
    });
  };
  return {
    credit: userCredit.data ?? 0,
    creditLoading: userCredit.isLoading,
    data: getSubscription,
    statusLoading: getSubscription.isLoading,
    status: getSubscription.data?.status,
    isLoading: getSubscription.isLoading,
    isSubscribed: getSubscription.data?.status === 'active' ?? false,
    isCanceled: getSubscription.data?.isCanceled,
    //
    createSubscriptionPortalLoading: makeSubsctiptionSession.isPending,
    createSubscriptionPortal,
    openCustomerPortalLoading: makeCustomerPortal.isPending,
    openCustomerPortal,

    openChargeAccountPortalLoading: chargeAccountPortal.isPending,
    openChargeAccountPortal
  };
};

export default useSubscription;
