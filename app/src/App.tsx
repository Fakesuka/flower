import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from '@/pages/client/HomePage';
import { CheckoutPage } from '@/pages/client/CheckoutPage';
import { OrderStatusPage } from '@/pages/client/OrderStatusPage';
import { LoginPage } from '@/pages/staff/LoginPage';
import { FloristPage } from '@/pages/staff/FloristPage';
import { AdminPage } from '@/pages/staff/AdminPage';
import { RequireRole, RequireStaff } from '@/router/guards';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/:id" element={<OrderStatusPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireStaff />}>
          <Route path="/florist" element={<FloristPage />} />
        </Route>

        <Route element={<RequireRole role="admin" />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <InstallPrompt />
    </>
  );
}

export default App;
