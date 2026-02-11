import { useEffect, useState, type ComponentType } from 'react';
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

const screenComponents: Record<Screen, ComponentType> = {
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

const mainScreens: Screen[] = ['home', 'catalog', 'cart', 'profile'];
const deepScreens: Screen[] = ['product', 'builder', 'checkout', 'orders', 'favorites', 'addresses', 'admin'];

function App() {
  const {
    currentScreen,
    navigateTo,
    getCartCount,
    initialize,
    error: storeError,
    settings,
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

  useEffect(() => {
    if (!settings?.seasonalTheme) {
      return;
    }

    const themeColors: Record<string, string> = {
      winter: '#E3F2FD',
      spring: '#FCE4EC',
      summer: '#FFF8E1',
      autumn: '#FFF3E0',
    };

    setHeaderColor(themeColors[settings.seasonalTheme] || '#FAFAFA');
  }, [settings?.seasonalTheme, setHeaderColor]);

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

  useEffect(() => {
    if (!telegramUser) {
      return;
    }

    useApiStore.setState({
      user: {
        id: String(telegramUser.id),
        name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
        phone: '',
        addresses: [],
        favorites: [],
        orders: [],
      },
    });
  }, [telegramUser]);

  useEffect(() => {
    if (deepScreens.includes(currentScreen)) {
      const cleanup = showBackButton(() => {
        hapticImpact('light');
        useApiStore.getState().goBack();
      });

      return cleanup;
    }

    hideBackButton();
  }, [currentScreen, showBackButton, hideBackButton, hapticImpact]);

  useEffect(() => {
    if (currentScreen === 'builder' || currentScreen === 'checkout') {
      enableClosingConfirmation();
      return;
    }

    disableClosingConfirmation();
  }, [currentScreen, enableClosingConfirmation, disableClosingConfirmation]);

  useEffect(() => {
    if (currentScreen === 'product') {
      const cleanup = setMainButton({
        text: 'В корзину',
        onClick: () => hapticImpact('medium'),
      });

      return cleanup;
    }

    hideMainButton();
  }, [currentScreen, setMainButton, hideMainButton, hapticImpact]);

  const handleNavigate = (screen: Screen) => {
    hapticImpact('light');
    navigateTo(screen);
  };

  const CurrentScreenComponent = screenComponents[currentScreen];
  const showBottomNav = mainScreens.includes(currentScreen);

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
