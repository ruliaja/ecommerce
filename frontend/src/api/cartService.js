import axiosInstance from './axiosInstance';

// Helper function to get guest_session_id from localStorage
const getGuestSessionId = () => {
  return localStorage.getItem('guest_session_id');
};

// Helper function to save guest_session_id to localStorage
const saveGuestSessionId = (sessionId) => {
  if (sessionId) {
    localStorage.setItem('guest_session_id', sessionId);
  }
};

export const cartService = {
  // Add item to cart
  addToCart: async (productId, quantity, price, userId = null, selectedSize = null, selectedColor = null) => {
    try {
      const payload = {
        user_id: userId,
        product_id: productId,
        quantity,
        price,
        selected_size: selectedSize,
        selected_color: selectedColor,
      };
      
      // Only add guest_session_id if user is not logged in
      if (!userId) {
        const guestSessionId = getGuestSessionId();
        payload.guest_session_id = guestSessionId;
      }
      
      const response = await axiosInstance.post('?action=add_to_cart', payload);
      
      // Save guest_session_id from response only if not logged in
      if (!userId && response.data.guest_session_id) {
        saveGuestSessionId(response.data.guest_session_id);
      }
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // Get cart items
  getCart: async (userId = null) => {
    try {
      const payload = {
        user_id: userId,
      };
      
      // Only add guest_session_id if user is not logged in
      if (!userId) {
        const guestSessionId = getGuestSessionId();
        payload.guest_session_id = guestSessionId;
      }
      
      const response = await axiosInstance.post('?action=get_cart', payload);
      
      // Save guest_session_id from response only if not logged in
      if (!userId && response.data.guest_session_id) {
        saveGuestSessionId(response.data.guest_session_id);
      }
      return response.data;
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  },

  // Update cart item quantity
  updateCartItem: async (cartId, quantity) => {
    try {
      const response = await axiosInstance.post('?action=update_cart_item', {
        cart_id: cartId,
        quantity,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  // Remove item from cart
  removeFromCart: async (cartId) => {
    try {
      const response = await axiosInstance.post('?action=remove_from_cart', {
        cart_id: cartId 
      });
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  // Clear all cart items
  clearCart: async (userId = null) => {
    try {
      const response = await axiosInstance.post('?action=clear_cart', {
        user_id: userId 
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },
};
