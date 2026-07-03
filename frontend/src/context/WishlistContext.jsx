import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import favoriteService from '../api/favoriteService';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wishlist from localStorage (for guests) or backend (for logged-in users)
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        if (user && user.id) {
          // Load from backend for logged-in users
          const response = await favoriteService.getFavorites(user.id);
          if (response.status === 'success') {
            setWishlist(response.data);
          }
        } else {
          // Load from localStorage for guests
          const savedWishlist = localStorage.getItem('wishlist');
          if (savedWishlist) {
            setWishlist(JSON.parse(savedWishlist));
          }
        }
      } catch (error) {
        console.error('Error loading wishlist:', error);
        // Fallback to localStorage
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
          try {
            setWishlist(JSON.parse(savedWishlist));
          } catch (e) {
            console.error('Error parsing saved wishlist:', e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, [user]);

  // Save wishlist to localStorage whenever it changes (for guests)
  useEffect(() => {
    if (!isLoading && !user) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isLoading, user]);

  const addToWishlist = async (product) => {
    try {
      if (user && user.id) {
        // Add to backend for logged-in users
        const response = await favoriteService.addToFavorite(user.id, product.id);
        if (response.status === 'error') {
          // Product might already exist in favorites, try to load fresh list
          const freshList = await favoriteService.getFavorites(user.id);
          if (freshList.status === 'success') {
            setWishlist(freshList.data);
          }
          return;
        }
      }

      // Update local state
      setWishlist(prev => {
        const exists = prev.some(item => item.id === product.id);
        if (exists) {
          return prev;
        }
        return [...prev, { ...product, addedAt: new Date().toISOString() }];
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      // Still add locally as fallback
      setWishlist(prev => {
        const exists = prev.some(item => item.id === product.id);
        if (exists) {
          return prev;
        }
        return [...prev, { ...product, addedAt: new Date().toISOString() }];
      });
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      if (user && user.id) {
        // Remove from backend for logged-in users
        await favoriteService.removeFromFavorite(user.id, productId);
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }

    // Update local state
    setWishlist(prev => prev.filter(item => item.id !== productId));
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const clearWishlist = async () => {
    try {
      if (user && user.id) {
        // Clear from backend for logged-in users
        await favoriteService.clearAllFavorites(user.id);
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
    }

    setWishlist([]);
  };

  const getWishlistCount = () => {
    return wishlist.length;
  };

  const value = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    getWishlistCount,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;
