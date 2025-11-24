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
  const [quantities, setQuantities] = useState({});

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!phone || cart.items.length === 0) return;

    try {
      setLoading(true);
      setPaymentStatus('🔄 Initiating payment...');
      
      const response = await api.post('/api/mpesa/pay', { phone });
      
      if (response.data.success) {
        setPaymentStatus('📱 An MPESA Prompt has been sent to Your Phone, Please Check & Complete Payment');
        
        // Poll for payment status
        const orderId = response.data.orderId;
        const checkStatus = setInterval(async () => {
          try {
            const statusResponse = await api.get(`/api/mpesa/status/${orderId}`);
            if (statusResponse.data.status === 'paid') {
              setPaymentStatus('✅ Payment successful! Your order has been confirmed.');
              clearInterval(checkStatus);
              clearCart();
              setQuantities({});
            } else if (statusResponse.data.status === 'failed') {
              setPaymentStatus('❌ Payment failed. Please try again.');
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
      if (error.response?.status === 404 || error.response?.status === 500) {
        setPaymentStatus('⚠️ Payment system temporarily unavailable. Please redeploy backend with M-Pesa integration.');
      } else {
        setPaymentStatus('❌ Payment failed. Please try again.');
      }
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

  const updateQuantity = (bookId, newQuantity) => {
    if (newQuantity < 1) return;
    setQuantities({ ...quantities, [bookId]: newQuantity });
  };

  const getItemQuantity = (item) => {
    return quantities[item.bookId._id] || item.quantity;
  };

  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      const quantity = getItemQuantity(item);
      const price = item.bookId?.price || 0;
      return total + (price * quantity);
    }, 0).toFixed(2);
  };

  return (
    <div className="container" style={{ marginTop: '2rem', maxWidth: '800px', margin: '2rem auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--jet-black)' }}>🛒 Shopping Cart</h2>
        <span style={{ marginLeft: '1rem', color: '#666' }}>({cart.items.length} items)</span>
      </div>
      
      {cart.items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h3>Your cart is empty</h3>
          <p style={{ color: '#666' }}>Add some books to get started!</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '2rem' }}>
            {cart.items.map(item => {
              const quantity = getItemQuantity(item);
              const itemTotal = (item.bookId?.price || 0) * quantity;
              
              return (
                <div key={item.bookId._id} className="card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {item.bookId.imageUrl && (
                    <img 
                      src={item.bookId.imageUrl} 
                      alt={item.bookId.title}
                      style={{ 
                        width: '80px', 
                        height: '100px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        marginRight: '1.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--jet-black)' }}>{item.bookId.title}</h4>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>by {item.bookId.author}</p>
                    <p style={{ margin: '0.25rem 0', fontWeight: 'bold', color: 'var(--primary-yellow)' }}>${item.bookId.price}</p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#888' }}>Condition: {item.bookId.condition}</p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => updateQuantity(item.bookId._id, quantity - 1)}
                        style={{ 
                          width: '30px', 
                          height: '30px', 
                          border: '1px solid #ddd', 
                          background: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        -
                      </button>
                      <span style={{ 
                        minWidth: '40px', 
                        textAlign: 'center', 
                        fontWeight: 'bold',
                        padding: '0.25rem 0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}>
                        {quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.bookId._id, quantity + 1)}
                        style={{ 
                          width: '30px', 
                          height: '30px', 
                          border: '1px solid #ddd', 
                          background: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        +
                      </button>
                    </div>
                    
                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--jet-black)' }}>${itemTotal.toFixed(2)}</div>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.bookId._id)}
                      style={{ 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ 
            padding: '1.5rem', 
            marginBottom: '2rem',
            backgroundColor: '#f8f9fa',
            border: '2px solid var(--primary-yellow)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total Amount:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--jet-black)' }}>${calculateTotal()}</span>
            </div>
          </div>

          <div className="card" style={{ 
            maxWidth: '500px', 
            margin: '0 auto',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--jet-black)' }}>💳 Checkout with M-Pesa</h3>
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
                style={{ 
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                {loading ? '⏳ Processing...' : `💰 Pay $${calculateTotal()} via M-Pesa`}
              </button>
            </form>
            
            {paymentStatus && (
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                backgroundColor: paymentStatus.includes('successful') ? '#d4edda' : '#f8d7da',
                border: `1px solid ${paymentStatus.includes('successful') ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '1.5rem', 
                  marginBottom: '0.5rem'
                }}>
                  {paymentStatus.includes('successful') ? '✅' : paymentStatus.includes('failed') ? '❌' : '⏳'}
                </div>
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