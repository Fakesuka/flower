import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HomeScreen } from '@/screens/HomeScreen';
import { CatalogScreen } from '@/screens/CatalogScreen';
import { ProductScreen } from '@/screens/ProductScreen';
import { BuilderScreen } from '@/screens/BuilderScreen';
import { CartScreen } from '@/screens/CartScreen';
import { CheckoutScreen } from '@/screens/CheckoutScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import { FavoritesScreen } from '@/screens/FavoritesScreen';
import { AdminScreen } from '@/screens/AdminScreen';
import { BottomNav } from '@/components/ui/BottomNav';
import { useApiStore } from '@/store/apiStore';
import { useTelegram } from '@/hooks/useTelegram';
import type { Screen } from '@/types';

// Screen components mapping
const screenComponents: Record<Screen, React.ComponentType> = {
  home: HomeScreen,
  catalog: CatalogScreen,
  product: ProductScreen,
  builder: BuilderScreen,
  cart: CartScreen,
  checkout: CheckoutScreen,
  profile: ProfileScreen,
  orders: OrdersScreen,
  addresses: ProfileScreen,
  favorites: FavoritesScreen,
  admin: AdminScreen,
};

// Screens that show bottom navigation
const mainScreens: Screen[] = ['home', 'catalog', 'cart', 'profile'];

// Screens that need back button
const deepScreens: Screen[] = ['product', 'builder', 'checkout', 'orders', 'favorites', 'addresses', 'admin'];

function App() {
  const { 
    currentScreen, 
    navigateTo, 
    getCartCount, 
    initialize,
    isLoading: storeLoading,
    error: storeError,
    settings,
    isAdmin 
  } = useApiStore();
  
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { 
    isReady, 
    showBackButton, 
    hideBackButton, 
    setMainButton,
    hideMainButton,
    enableClosingConfirmation,
    disableClosingConfirmation,
    hapticImpact,
    user: telegramUser,
    setHeaderColor,
  } = useTelegram();

  // Apply seasonal theme
  useEffect(() => {
    if (settings?.seasonalTheme) {
      const themeColors: Record<string, string> = {
        winter: '#E3F2FD',
        spring: '#FCE4EC',
        summer: '#FFF8E1',
        autumn: '#FFF3E0',
      };
      setHeaderColor(themeColors[settings.seasonalTheme] || '#FAFAFA');
    }
  }, [settings?.seasonalTheme, setHeaderColor]);

  // Initialize app data on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initialize();
      } catch (e) {
        console.error('Failed to initialize app:', e);
      } finally {
        setIsInitializing(false);
      }
    };
    
    if (isReady) {
      init();
    }
  }, [isReady, initialize]);

  // Set Telegram user in store
  useEffect(() => {
    if (telegramUser) {
      useApiStore.setState({
        user: {
          id: String(telegramUser.id),
          name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
          phone: '',
          addresses: [],
          favorites: [],
          orders: [],
        }
      });
    }
  }, [telegramUser]);

  // Handle Telegram back button
  useEffect(() => {
    if (deepScreens.includes(currentScreen)) {
      const cleanup = showBackButton(() => {
        hapticImpact('light');
        navigateTo('home');
      });
      return cleanup;
    } else {
      hideBackButton();
    }
  }, [currentScreen, showBackButton, hideBackButton, navigateTo, hapticImpact]);

  // Handle closing confirmation on builder/checkout
  useEffect(() => {
    if (currentScreen === 'builder' || currentScreen === 'checkout') {
      enableClosingConfirmation();
    } else {
      disableClosingConfirmation();
    }
  }, [currentScreen, enableClosingConfirmation, disableClosingConfirmation]);

  // Handle main button for certain screens
  useEffect(() => {
    if (currentScreen === 'product') {
      const cleanup = setMainButton({
        text: 'В корзину',
        onClick: () => {
          hapticImpact('medium');
        },
      });
      return cleanup;
    } else {
      hideMainButton();
    }
  }, [currentScreen, setMainButton, hideMainButton, hapticImpact]);

  const handleNavigate = (screen: Screen) => {
    hapticImpact('light');
    navigateTo(screen);
  };

  const CurrentScreenComponent = screenComponents[currentScreen];
  const showBottomNav = mainScreens.includes(currentScreen);

  // Show loading state while initializing
  if (!isReady || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-milk">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-dusty-rose/30 border-t-dusty-rose rounded-full"
        />
      </div>
    );
  }

  // Show error state
  if (storeError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-milk p-6">
        <div className="text-dusty-rose text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-medium text-charcoal mb-2">Что-то пошло не так</h2>
        <p className="text-sm text-stone text-center mb-4">{storeError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-dusty-rose text-white rounded-full text-sm font-medium"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-milk">
      {/* Main Content */}
      <main className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CurrentScreenComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          cartCount={getCartCount()}
        />
      )}
    </div>
  );
}

export default App;
