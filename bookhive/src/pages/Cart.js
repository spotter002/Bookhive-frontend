import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Cart = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!phone || cart.items.length === 0) return;

    try {
      setLoading(true);
      setPaymentStatus('Initiating payment...');
      
      const response = await api.post('/api/mpesa/pay', { phone });
      
      if (response.data.success) {
        setPaymentStatus('Payment initiated! Check your phone for M-Pesa prompt.');
        
        // Poll for payment status
        const orderId = response.data.orderId;
        const checkStatus = setInterval(async () => {
          try {
            const statusResponse = await api.get(`/api/mpesa/status/${orderId}`);
            if (statusResponse.data.status === 'paid') {
              setPaymentStatus('Payment successful! Your order has been confirmed.');
              clearInterval(checkStatus);
              clearCart();
            } else if (statusResponse.data.status === 'failed') {
              setPaymentStatus('Payment failed. Please try again.');
              clearInterval(checkStatus);
            }
          } catch (error) {
            clearInterval(checkStatus);
          }
        }, 3000);

        // Stop polling after 2 minutes
        setTimeout(() => clearInterval(checkStatus), 120000);
      }
    } catch (error) {
      setPaymentStatus('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <p>Please login to view your cart.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h2>Shopping Cart</h2>
      
      {cart.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div style={{ marginBottom: '2rem' }}>
            {cart.items.map(item => (
              <div key={item.bookId._id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                {item.bookId.imageUrl && (
                  <img 
                    src={item.bookId.imageUrl} 
                    alt={item.bookId.title}
                    style={{ width: '60px', height: '80px', objectFit: 'cover', marginRight: '1rem' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h4>{item.bookId.title}</h4>
                  <p>Author: {item.bookId.author}</p>
                  <p>Price: ${item.bookId.price}</p>
                  <p>Quantity: {item.quantity}</p>
                </div>
                <button 
                  onClick={() => removeFromCart(item.bookId._id)}
                  style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'right', marginBottom: '2rem' }}>
            <h3>Total: ${cart.totalAmount}</h3>
          </div>

          <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h3>Checkout with M-Pesa</h3>
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label>Phone Number (254XXXXXXXXX)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="254712345678"
                  required
                  pattern="254[0-9]{9}"
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Processing...' : `Pay $${cart.totalAmount} via M-Pesa`}
              </button>
            </form>
            
            {paymentStatus && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: paymentStatus.includes('successful') ? '#d4edda' : '#f8d7da',
                borderRadius: '4px'
              }}>
                {paymentStatus}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;