import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../utils/api';

const BookDetails = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showManagement, setShowManagement] = useState(false);
  const [inventory, setInventory] = useState({ copiesAvailable: 0, totalCopies: 0, status: '' });

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      const response = await api.get(`/api/books/${id}`);
      setBook(response.data);
      setInventory({
        copiesAvailable: response.data.copiesAvailable || 0,
        totalCopies: response.data.totalCopies || 1,
        status: response.data.status || 'Available'
      });
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async () => {
    try {
      await api.patch(`/api/books/${id}/inventory`, inventory);
      fetchBook();
      alert('Inventory updated successfully!');
    } catch (error) {
      alert('Error updating inventory');
    }
  };

  const deleteBook = async () => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await api.delete(`/api/books/${id}`);
        alert('Book deleted successfully!');
        window.history.back();
      } catch (error) {
        alert('Error deleting book');
      }
    }
  };

  const isOwner = user && book && book.ownerId && book.ownerId._id === user.id;

  if (loading) return <div className="container">Loading...</div>;
  if (!book) return <div className="container">Book not found</div>;

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          <div>
            <div style={{ 
              width: '100%', 
              height: '300px', 
              backgroundColor: '#f0f0f0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '8px',
              backgroundImage: book.imageUrl ? `url(${book.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              {!book.imageUrl && '📚 Book Cover'}
            </div>
          </div>
          
          <div>
            <h1 style={{ color: 'var(--jet-black)', marginBottom: '1rem' }}>
              {book.title}
            </h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              <strong>Author:</strong> {book.author}
            </p>
            {book.course && (
              <p style={{ marginBottom: '1rem' }}>
                <strong>Course:</strong> {book.course}
              </p>
            )}
            {book.genre && (
              <p style={{ marginBottom: '1rem' }}>
                <strong>Genre:</strong> {book.genre}
              </p>
            )}
            {book.subject && (
              <p style={{ marginBottom: '1rem' }}>
                <strong>Subject:</strong> {book.subject}
              </p>
            )}
            <p style={{ marginBottom: '1rem' }}>
              <strong>Condition:</strong> {book.condition}
            </p>
            <p style={{ marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 'bold' }}>
              <strong>Price:</strong> {book.swapOnly ? 'Swap Only' : `$${book.price}`}
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>Status:</strong> {book.status}
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>Available Copies:</strong> {book.copiesAvailable} / {book.totalCopies}
            </p>
            {(book.status === 'Sold Out' || book.copiesAvailable === 0) && (
              <div style={{ padding: '0.5rem', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', color: '#721c24', marginBottom: '1rem' }}>
                <strong>⚠️ This book is sold out</strong>
              </div>
            )}
            {book.description && (
              <div style={{ marginBottom: '2rem' }}>
                <strong>Description:</strong>
                <p style={{ marginTop: '0.5rem' }}>{book.description}</p>
              </div>
            )}
            
            {isOwner ? (
              <div style={{ marginBottom: '2rem' }}>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowManagement(!showManagement)}
                  style={{ marginBottom: '1rem' }}
                >
                  {showManagement ? 'Hide Management' : 'Manage Book'}
                </button>
                
                {showManagement && (
                  <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                    <h4>Book Management</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label>Total Copies:</label>
                        <input 
                          type="number" 
                          min="1"
                          value={inventory.totalCopies}
                          onChange={(e) => setInventory({...inventory, totalCopies: parseInt(e.target.value)})}
                          style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                        />
                      </div>
                      <div>
                        <label>Available Copies:</label>
                        <input 
                          type="number" 
                          min="0"
                          max={inventory.totalCopies}
                          value={inventory.copiesAvailable}
                          onChange={(e) => setInventory({...inventory, copiesAvailable: parseInt(e.target.value)})}
                          style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                        />
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label>Status:</label>
                      <select 
                        value={inventory.status}
                        onChange={(e) => setInventory({...inventory, status: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                      >
                        <option value="Available">Available</option>
                        <option value="Pending">Pending</option>
                        <option value="Sold">Sold</option>
                        <option value="Sold Out">Sold Out</option>
                        <option value="Swapped">Swapped</option>
                      </select>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="btn-primary" onClick={updateInventory}>
                        Update Inventory
                      </button>
                      <button className="btn-danger" onClick={deleteBook} style={{ backgroundColor: '#dc3545' }}>
                        Delete Book
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '2rem' }}>
                {book.status === 'Sold Out' || book.copiesAvailable === 0 ? (
                  <div style={{ padding: '1rem', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', color: '#721c24' }}>
                    <strong>This book is currently sold out</strong>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Contact the seller to check if more copies will be available.</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <button 
                        className="btn-primary"
                        onClick={async () => {
                          if (book.swapOnly) {
                            const subject = `Book Swap Request: "${book.title}" by ${book.author}`;
                            const body = `Hi,%0D%0A%0D%0AI would like to swap books with you. I'm interested in your book "${book.title}" by ${book.author}.%0D%0A%0D%0ACondition: ${book.condition}%0D%0A%0D%0AI have [describe your book(s) for swap] available for exchange.%0D%0A%0D%0APlease let me know if you're interested in a swap.%0D%0A%0D%0AThanks!`;
                            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${book.ownerId?.email}&su=${encodeURIComponent(subject)}&body=${body}`, '_blank');
                          } else {
                            const success = await addToCart(book._id);
                            if (success) {
                              alert('Book added to cart!');
                            } else {
                              alert('Failed to add book to cart');
                            }
                          }
                        }}
                      >
                        {book.swapOnly ? 'Request Swap' : 'Add to Cart'}
                      </button>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      <p style={{ margin: '0.25rem 0' }}>
                        <strong>{book.swapOnly ? 'Request Swap:' : 'Add to Cart:'}</strong> {book.swapOnly ? 'Contact seller to arrange a book exchange' : 'Add this book to your cart for checkout'}
                      </p>
                    </div>
                  </div>
                )}
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    const subject = `Question about "${book.title}" by ${book.author}`;
                    const body = `Hi,%0D%0A%0D%0AI have a question about your book "${book.title}" by ${book.author}.%0D%0A%0D%0APrice: ${book.swapOnly ? 'Swap Only' : `$${book.price}`}%0D%0ACondition: ${book.condition}%0D%0A%0D%0A[Your question here]%0D%0A%0D%0AThanks!`;
                    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${book.ownerId?.email}&su=${encodeURIComponent(subject)}&body=${body}`, '_blank');
                  }}
                  style={{ marginTop: '1rem' }}
                >
                  Ask Question
                </button>
                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Ask Question:</strong> Send a message to ask about book details, condition, or availability
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {book.ownerId && !isOwner && (
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <h3>Seller Information</h3>
            <p><strong>Name:</strong> {book.ownerId.name}</p>
            <p><strong>Email:</strong> {book.ownerId.email}</p>
            {book.ownerId.location && (
              <p><strong>Location:</strong> {book.ownerId.location}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetails;