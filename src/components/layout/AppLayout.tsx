import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

const noNavRoutes = ['/', '/onboarding', '/create', '/auth'];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const showNav = !noNavRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <main className={showNav ? 'pb-20' : ''}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
