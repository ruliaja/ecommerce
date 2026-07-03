import axiosInstance from './axiosInstance';

export const favoriteService = {
  // Add product to favorites
  addToFavorite: async (userId, productId) => {
    try {
      const response = await axiosInstance.post('?action=add_to_favorite', {
        user_id: userId,
        product_id: productId
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to favorite:', error);
      throw error;
    }
  },

  // Remove product from favorites
  removeFromFavorite: async (userId, productId) => {
    try {
      const response = await axiosInstance.post('?action=remove_from_favorite', {
        user_id: userId,
        product_id: productId
      });
      return response.data;
    } catch (error) {
      console.error('Error removing from favorite:', error);
      throw error;
    }
  },

  // Get user's favorites
  getFavorites: async (userId) => {
    try {
      const response = await axiosInstance.get('?action=get_favorites', {
        params: {
          user_id: userId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting favorites:', error);
      throw error;
    }
  },

  // Check if product is favorite
  isFavorite: async (userId, productId) => {
    try {
      const response = await axiosInstance.get('?action=is_favorite', {
        params: {
          user_id: userId,
          product_id: productId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking favorite:', error);
      throw error;
    }
  },

  // Clear all favorites
  clearAllFavorites: async (userId) => {
    try {
      const response = await axiosInstance.post('?action=clear_all_favorites', {
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      throw error;
    }
  }
};

export default favoriteService;
