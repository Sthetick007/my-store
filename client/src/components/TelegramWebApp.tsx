import { useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

interface TelegramWebAppProps {
  children: React.ReactNode;
}

export function TelegramWebApp({ children }: TelegramWebAppProps) {
  const { webApp, isReady } = useTelegram();

  useEffect(() => {
    if (webApp && isReady) {
      // Set up theme variables
      document.documentElement.classList.add('dark');
      
      // Handle viewport changes
      const handleViewportChange = () => {
        document.documentElement.style.setProperty('--tg-viewport-height', `${webApp.viewportHeight}px`);
        document.documentElement.style.setProperty('--tg-viewport-stable-height', `${webApp.viewportStableHeight}px`);
      };
      
      webApp.onEvent('viewportChanged', handleViewportChange);
      handleViewportChange();
      
      // Handle theme changes
      const handleThemeChange = () => {
        if (webApp.colorScheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      
      webApp.onEvent('themeChanged', handleThemeChange);
      handleThemeChange();
      
      return () => {
        webApp.offEvent('viewportChanged', handleViewportChange);
        webApp.offEvent('themeChanged', handleThemeChange);
      };
    }
  }, [webApp, isReady]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
