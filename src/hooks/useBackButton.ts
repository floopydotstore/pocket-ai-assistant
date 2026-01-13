import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';

export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = App.addListener('backButton', ({ canGoBack }) => {
      // If we're on the dashboard or onboarding, minimize the app
      if (location.pathname === '/dashboard' || location.pathname === '/onboarding' || location.pathname === '/') {
        App.minimizeApp();
      } else if (canGoBack) {
        // Otherwise, go back in history
        navigate(-1);
      } else {
        // Fallback to dashboard
        navigate('/dashboard');
      }
    });

    return () => {
      handleBackButton.then(listener => listener.remove());
    };
  }, [navigate, location.pathname]);
}

