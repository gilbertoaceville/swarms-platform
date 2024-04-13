'use client';

import Link from 'next/link';
import { SignOut } from '@/shared/utils/auth-helpers/server';
import { handleRequest } from '@/shared/utils/auth-helpers/client';
import Logo from '@/shared/components/icons/Logo';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/shared/utils/auth-helpers/settings';
import s from './Navbar.module.css';
import { DISCORD, PLATFORM, SWARMS_GITHUB } from '@/shared/constants/links';
import { cn } from '@/shared/utils/cn';
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from '../drawer';
import { Button } from '../Button';
import { Menu, X } from 'lucide-react';

interface NavlinksProps {
  user?: any;
  isDashboard?: boolean;
}

export default function Navlinks({ user, isDashboard }: NavlinksProps) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;

  return (
    <div className="relative flex justify-center py-2 align-center md:py-6 px-4">
      <div className="flex flex-shrink-0 items-center">
        {/* desktop */}
        {!isDashboard && (
          <div className="flex items-center w-[40px] h-[40px] min-w-[40px] max-md:hidden">
            <Logo />
          </div>
        )}
        <nav className={cn("flex ml-2 md:ml-6 gap-4", !isDashboard && "max-md:hidden")}>
          <Link href="/pricing" className={s.link}>
            Pricing
          </Link>
          <Link href={SWARMS_GITHUB} className={cn(s.link, 'hidden md:flex')}>
            GitHub
          </Link>
          <Link href={DISCORD} className={cn(s.link, 'hidden md:flex')}>
            Community
          </Link>
          <Link href="https://swarms.apac.ai/en/latest/" className={s.link}>
            Docs
          </Link>
          {isDashboard && (
            <Link
              href="https://calendly.com/swarm-corp/30min"
              className={s.link}
            >
              Get Demo
            </Link>
          )}
          {user && !isDashboard && (
            <Link href={PLATFORM.DASHBOARD} className={s.link}>
              Dashboard
            </Link>
          )}
        </nav>
        {/* mobile */}
        {!isDashboard && (
          <div className="md:hidden">
            <Drawer direction="left">
              <DrawerTrigger asChild>
                <Button className="text-white p-0" variant="link">
                  <Menu />
                </Button>
              </DrawerTrigger>

              <DrawerContent className="flex flex-col h-full w-[300px] mt-24 fixed bottom-0 rounded-none">
                <div className="p-4 bg-background flex-1 h-full flex flex-col gap-4">
                  <div className="flex gap-2 items-center">
                    <div className="flex items-center w-[40px] h-[40px] min-w-[40px]">
                      <Logo />
                    </div>
                    <h2 className="font-bold text-primary">SWARMS</h2>
                  </div>
                  <DrawerClose className="absolute top-4 right-4">
                    <X />
                  </DrawerClose>
                  <Link href="/pricing" className={s.link}>
                    Pricing
                  </Link>
                  <Link href={SWARMS_GITHUB} className={s.link}>
                    GitHub
                  </Link>
                  <Link href={DISCORD} className={s.link}>
                    Community
                  </Link>
                  <Link
                    href="https://swarms.apac.ai/en/latest/"
                    className={s.link}
                  >
                    Docs
                  </Link>
                  {user && (
                    <Link href={PLATFORM.DASHBOARD} className={s.link}>
                      Dashboard
                    </Link>
                  )}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        )}
      </div>
      {/* common */}
      {!isDashboard && (
        <div className="flex justify-end items-center gap-2 w-full">
          {user ? (
            <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
              <input type="hidden" name="pathName" value={usePathname()} />
              <button type="submit" className={s.link}>
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/signin" className={s.link}>
              Sign In
            </Link>
          )}
          <Link href="https://calendly.com/swarm-corp/30min" className={s.link}>
            Get Demo
          </Link>
        </div>
      )}
    </div>
  );
}
