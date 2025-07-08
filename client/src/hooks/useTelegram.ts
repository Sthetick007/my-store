import { useEffect, useState } from 'react';
import type { TelegramWebApp, TelegramUser } from '@/types';

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if we're running in Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      console.log('🔗 Telegram WebApp detected:', {
        initData: !!tg.initData,
        initDataUnsafe: tg.initDataUnsafe,
        user: tg.initDataUnsafe?.user,
        version: tg.version
      });
      
      setWebApp(tg);
      setUser(tg.initDataUnsafe.user || null);
      
      // Initialize WebApp
      tg.ready();
      setIsReady(true);
      
      // Set theme based on Telegram theme
      if (tg.themeParams.bg_color) {
        document.documentElement.style.setProperty('--tg-bg-color', tg.themeParams.bg_color);
      }
      if (tg.themeParams.text_color) {
        document.documentElement.style.setProperty('--tg-text-color', tg.themeParams.text_color);
      }
      
      // Expand the WebApp
      tg.expand();
      
      // Set up main button
      tg.MainButton.setText('Checkout');
      tg.MainButton.hide();
      
      // Handle close confirmation
      tg.isClosingConfirmationEnabled = true;
    } else {
      // Development mode - set up mock data
      console.log('⚠️ Development mode - using mock Telegram data');
      setIsReady(true);
      setUser({
        id: 123456789,
        first_name: 'Dev',
        last_name: 'User',
        username: 'devuser',
        language_code: 'en',
      });
      
      // Create mock WebApp object for development
      const mockWebApp = {
        initData: '',
        initDataUnsafe: {
          user: {
            id: 123456789,
            first_name: 'Dev',
            last_name: 'User',
            username: 'devuser',
            language_code: 'en',
          }
        },
        version: '6.0',
        platform: 'unknown',
        colorScheme: 'dark',
        themeParams: {},
        isExpanded: true,
        viewportHeight: window.innerHeight,
        viewportStableHeight: window.innerHeight,
        ready: () => {},
        expand: () => {},
        close: () => {},
        MainButton: {
          text: '',
          color: '',
          textColor: '',
          isVisible: false,
          isActive: true,
          isProgressVisible: false,
          setText: () => {},
          onClick: () => {},
          offClick: () => {},
          show: () => {},
          hide: () => {},
          enable: () => {},
          disable: () => {},
          showProgress: () => {},
          hideProgress: () => {}
        },
        onEvent: () => {},
        offEvent: () => {},
        sendData: () => {},
        isClosingConfirmationEnabled: false
      } as TelegramWebApp;
      
      setWebApp(mockWebApp);
    }
  }, []);

  const showMainButton = (text: string, callback: () => void) => {
    if (webApp) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(callback);
      webApp.MainButton.show();
    }
  };

  const hideMainButton = () => {
    if (webApp) {
      webApp.MainButton.hide();
    }
  };

  const showBackButton = (callback: () => void) => {
    if (webApp) {
      webApp.BackButton.onClick(callback);
      webApp.BackButton.show();
    }
  };

  const hideBackButton = () => {
    if (webApp) {
      webApp.BackButton.hide();
    }
  };

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
    if (webApp && webApp.HapticFeedback) {
      try {
        if (type === 'success' || type === 'error' || type === 'warning') {
          webApp.HapticFeedback.notificationOccurred(type);
        } else {
          webApp.HapticFeedback.impactOccurred(type);
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }
  };

  const showAlert = (message: string, callback?: () => void) => {
    if (webApp) {
      webApp.showAlert(message, callback);
    } else {
      alert(message);
      callback?.();
    }
  };

  const showConfirm = (message: string, callback?: (confirmed: boolean) => void) => {
    if (webApp) {
      webApp.showConfirm(message, callback);
    } else {
      const confirmed = confirm(message);
      callback?.(confirmed);
    }
  };

  const close = () => {
    if (webApp) {
      webApp.close();
    }
  };

  return {
    webApp,
    user,
    isReady,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    hapticFeedback,
    showAlert,
    showConfirm,
    close,
  };
}
