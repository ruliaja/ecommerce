import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../api/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user, isLoading: authIsLoading } = useAuth();

  // Load cart dari database saat user login atau app start
  useEffect(() => {
    // Tunggu sampai AuthContext selesai loading
    if (authIsLoading) {
      return;
    }

    if (isAuthenticated && user) {
      loadCartFromDatabase();
    } else {
      setCart([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, authIsLoading]);

  const loadCartFromDatabase = async () => {
    try {
      setIsLoading(true);
      console.log('📦 Loading cart from database for user:', user?.id);

      // Gunakan user_id jika user login
      const result = await cartService.getCart(user?.id);

      if (result.status === 'success') {
        console.log('✅ Cart loaded:', result.data);
        setCart(result.data);
      } else {
        console.error('❌ Failed to load cart:', result.message);
        setCart([]);
      }
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      setCart([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1, selectedSize = null, selectedColor = null) => {
    try {
      if (!isAuthenticated || !user) {
        throw new Error('Silakan login terlebih dahulu');
      }

      console.log('🛒 Adding to cart:', product.id, quantity, selectedSize, selectedColor);

      const result = await cartService.addToCart(
        product.id,
        quantity,
        product.price,
        user.id,
        selectedSize,
        selectedColor
      );

      if (result.status === 'success') {
        console.log('✅ Added to database');
        // Reload cart dari database
        await loadCartFromDatabase();
      } else {
        console.error('❌ Failed to add:', result.message);
        throw new Error(result.message || 'Gagal menambah ke keranjang');
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (cartId) => {
    try {
      if (!cartId) {
        console.error('❌ Cart item not found');
        return;
      }

      console.log('🗑️ Removing from cart:', cartId);

      const result = await cartService.removeFromCart(cartId);

      if (result.status === 'success') {
        console.log('✅ Removed from database');
        // Reload cart dari database
        await loadCartFromDatabase();
      } else {
        console.error('❌ Failed to remove:', result.message);
        throw new Error(result.message || 'Gagal menghapus dari keranjang');
      }
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      throw error;
    }
  };

  const removeMultipleFromCart = async (cartIds) => {
    try {
      console.log('🗑️ Removing multiple from cart:', cartIds);

      // Filter out invalid items
      const validCartIds = cartIds.filter(id => id);

      if (validCartIds.length === 0) return;

      // Perform all removals in parallel
      const removePromises = validCartIds.map(cartId =>
        cartService.removeFromCart(cartId)
      );

      await Promise.all(removePromises);

      console.log('✅ All items removed from database');
      // Reload cart once after all removals are done
      await loadCartFromDatabase();
    } catch (error) {
      console.error('❌ Error removing multiple items:', error);
      throw error;
    }
  };

  const updateQuantity = async (cartId, quantity) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(cartId);
        return;
      }

      if (!cartId) {
        console.error('❌ Cart item not found');
        return;
      }

      console.log('✏️ Updating quantity:', cartId, quantity);

      const result = await cartService.updateCartItem(cartId, quantity);

      if (result.status === 'success') {
        console.log('✅ Updated in database');
        // Reload cart dari database
        await loadCartFromDatabase();
      } else {
        console.error('❌ Failed to update:', result.message);
        throw new Error(result.message || 'Gagal update quantity');
      }
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      throw error;
    }
  };;

  const clearCart = async () => {
    try {
      console.log('🧹 Clearing cart for user:', user?.id);

      const result = await cartService.clearCart(user?.id);

      if (result.status === 'success') {
        console.log('✅ Cart cleared in database');
        setCart([]);
      } else {
        console.error('❌ Failed to clear:', result.message);
        throw new Error(result.message || 'Gagal clear keranjang');
      }
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      // Still clear local state even if API fails
      setCart([]);
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        removeFromCart,
        removeMultipleFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        syncCartFromDatabase: loadCartFromDatabase,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
