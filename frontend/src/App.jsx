import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ModalProvider } from './context/ModalContext';
import NotificationContainer from './components/NotificationContainer';
import ModalContainer from './components/ModalContainer';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import UserProfile from './pages/UserProfile';
import ChangePassword from './pages/ChangePassword';
import Orders from './pages/Orders';
import Favorites from './pages/Favorites';
import AddressManagement from './pages/AddressManagement';
import FAQ from './pages/FAQ';
import About from './pages/About';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import UserManagement from './pages/admin/Users';
import PaymentSettings from './pages/admin/PaymentSettings';
import SalesReport from './pages/admin/SalesReport';
import ChatManagement from './pages/admin/ChatManagement';
import AdminRoute from './pages/admin/AdminRoute';
import Chat from './components/chat';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ModalProvider>
              <Router>
              <NotificationContainer />
              <ModalContainer />
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* Public Routes */}
                <Route path="/faq" element={<FAQ />} />
                <Route path="/about" element={<About />} />

                {/* Profile Routes */}
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/profile/orders" element={<Orders />} />
                <Route path="/profile/password" element={<ChangePassword />} />
                <Route path="/profile/address" element={<AddressManagement />} />
                <Route path="/profile/address" element={<AddressManagement />} />
                <Route path="/profile/*" element={<UserProfile />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
                <Route path="/admin/products" element={<AdminRoute><ProductManagement /></AdminRoute>} />
                <Route path="/admin/orders" element={<AdminRoute><OrderManagement /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                <Route path="/admin/payment-settings" element={<AdminRoute><PaymentSettings /></AdminRoute>} />
                <Route path="/admin/sales-report" element={<AdminRoute><SalesReport /></AdminRoute>} />
                <Route path="/admin/chat" element={<AdminRoute><ChatManagement /></AdminRoute>} />

                {/* Public Routes */}
                <Route
                  path="/*"
                  element={
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/shop" element={<Products />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/order-success" element={<OrderSuccess />} />
                        <Route path="/favorites" element={<Favorites />} />
                      </Routes>
                    </MainLayout>
                  }
                />
              </Routes>
              <Chat />
            </Router>
            </ModalProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;