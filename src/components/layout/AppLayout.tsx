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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed safe area background for status bar */}
      <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-background z-50" />
      
      <main className={`flex-1 safe-area-top ${showNav ? 'pb-20 safe-area-bottom' : ''}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
