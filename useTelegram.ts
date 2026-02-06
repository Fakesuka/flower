import { useEffect, useState, useCallback } from 'react';

// Telegram WebApp types
interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    setParams: (params: { color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  colorScheme: 'light' | 'dark';
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
  platform: string;
  version: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramWebApp['initDataUnsafe']['user'] | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setUser(tg.initDataUnsafe?.user || null);
      setIsReady(true);
      
      // Add Telegram WebApp class to body
      document.body.classList.add('telegram-webapp');
    } else {
      console.log('Telegram WebApp not available - running in browser mode');
      setIsReady(true);
    }
  }, []);

  const hapticImpact = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
    webApp?.HapticFeedback?.impactOccurred(style);
  }, [webApp]);

  const hapticNotification = useCallback((type: 'error' | 'success' | 'warning') => {
    webApp?.HapticFeedback?.notificationOccurred(type);
  }, [webApp]);

  const hapticSelection = useCallback(() => {
    webApp?.HapticFeedback?.selectionChanged();
  }, [webApp]);

  const showBackButton = useCallback((onClick: () => void) => {
    webApp?.BackButton.show();
    webApp?.BackButton.onClick(onClick);
    
    return () => {
      webApp?.BackButton.hide();
      webApp?.BackButton.offClick(onClick);
    };
  }, [webApp]);

  const hideBackButton = useCallback(() => {
    webApp?.BackButton.hide();
  }, [webApp]);

  const setMainButton = useCallback((params: {
    text: string;
    color?: string;
    textColor?: string;
    isActive?: boolean;
    onClick: () => void;
  }) => {
    if (!webApp) return;
    
    webApp.MainButton.setText(params.text);
    webApp.MainButton.setParams({
      color: params.color || '#D98F9A',
      text_color: params.textColor || '#FFFFFF',
      is_active: params.isActive !== false,
      is_visible: true,
    });
    webApp.MainButton.onClick(params.onClick);
    webApp.MainButton.show();
    
    return () => {
      webApp.MainButton.hide();
      webApp.MainButton.offClick(params.onClick);
    };
  }, [webApp]);

  const hideMainButton = useCallback(() => {
    webApp?.MainButton.hide();
  }, [webApp]);

  const enableClosingConfirmation = useCallback(() => {
    webApp?.enableClosingConfirmation();
  }, [webApp]);

  const disableClosingConfirmation = useCallback(() => {
    webApp?.disableClosingConfirmation();
  }, [webApp]);

  return {
    isReady,
    webApp,
    user,
    hapticImpact,
    hapticNotification,
    hapticSelection,
    showBackButton,
    hideBackButton,
    setMainButton,
    hideMainButton,
    enableClosingConfirmation,
    disableClosingConfirmation,
    platform: webApp?.platform || 'web',
    isTelegram: !!webApp,
  };
}
