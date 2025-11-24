import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchCart = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await api.get('/api/cart');
      setCart(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setCart({ items: [], totalAmount: 0 });
      } else {
        console.error('Error fetching cart:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (bookId, quantity = 1) => {
    try {
      const response = await api.post('/api/cart/add', { bookId, quantity });
      setCart(response.data);
      return true;
    } catch (error) {
      if (error.response?.status === 400) {
        alert(error.response.data.message);
        return false;
      }
      if (error.response?.status === 404) {
        // Fallback: store in localStorage if backend not available
        const localCart = JSON.parse(localStorage.getItem('cart') || '{"items":[], "totalAmount":0}');
        const existingItem = localCart.items.find(item => item.bookId === bookId);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          localCart.items.push({ bookId, quantity });
        }
        localStorage.setItem('cart', JSON.stringify(localCart));
        setCart(localCart);
        return true;
      }
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  const removeFromCart = async (bookId) => {
    try {
      const response = await api.delete(`/api/cart/remove/${bookId}`);
      setCart(response.data);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/api/cart/clear');
      setCart({ items: [], totalAmount: 0 });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      removeFromCart,
      clearCart,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};