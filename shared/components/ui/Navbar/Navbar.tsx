import { createClient } from '@/shared/utils/supabase/server';
import s from './Navbar.module.css';
import Navlinks from './Navlinks';
import { cn } from '@/shared/utils/cn';

export default async function Navbar({ isDashboard }: { isDashboard?: boolean }) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <nav className={cn(s.root, "mt-auto")}>
      <a href="#skip" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <div className="max-w-6xl mx-auto">
        <Navlinks user={user} isDashboard={isDashboard} />
      </div>
    </nav>
  );
}
