import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

const noNavRoutes = ['/', '/onboarding', '/create', '/auth'];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat/');
  const showNav = !noNavRoutes.includes(location.pathname) && !isChatRoute;

  return (
    <div className="min-h-screen bg-background safe-area-top">
      <main className={showNav ? 'pb-20 safe-area-bottom' : ''}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
