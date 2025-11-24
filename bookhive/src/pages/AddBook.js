import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AddBook = () => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    course: '',
    genre: '',
    subject: '',
    condition: 'Good',
    price: '',
    swapOnly: false,
    description: ''
  });
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageUpload = async (file) => {
    const uploadData = new FormData();
    uploadData.append('image', file);
    
    try {
      const response = await api.post('/api/upload/image', uploadData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.imageUrl;
    } catch (error) {
      throw new Error('Image upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let bookData = { ...formData };
      console.log('Form data before submission:', bookData);
      
      // Upload image if selected
      const imageInput = document.querySelector('input[type="file"]');
      if (imageInput && imageInput.files[0]) {
        const imageUrl = await handleImageUpload(imageInput.files[0]);
        bookData.imageUrl = imageUrl;
      }
      
      // Ensure fields have correct types
      bookData.genre = bookData.genre || '';
      bookData.subject = bookData.subject || '';
      bookData.swapOnly = !!bookData.swapOnly;
      bookData.price = bookData.swapOnly ? 0 : (bookData.price === '' ? 0 : parseFloat(bookData.price));

      console.log('Final book data being sent:', bookData);
      await api.post('/api/books', bookData);
      navigate('/');
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.response?.data?.message || 'Failed to add book');
    }
  };

  if (!token) {
    return (
      <div className="container">
        <p>Please login to add a book.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px', marginTop: '2rem' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Add New Book</h2>
        
        {error && (
          <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Author *</label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Book Cover Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const preview = document.getElementById('imagePreview');
                    if (preview) {
                      preview.src = event.target.result;
                      preview.style.display = 'block';
                    }
                  };
                  reader.readAsDataURL(e.target.files[0]);
                }
              }}
            />
            <img id="imagePreview" style={{ display: 'none', maxWidth: '200px', marginTop: '10px', borderRadius: '8px' }} alt="Preview" />
          </div>

          <div className="form-group">
            <label>Course/Subject</label>
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Genre</label>
            <select
              name="genre"
              value={formData.genre}
              onChange={handleChange}
            >
              <option value="">Select Genre</option>
              <option value="Fiction">Fiction</option>
              <option value="Non-Fiction">Non-Fiction</option>
              <option value="Mystery">Mystery</option>
              <option value="Romance">Romance</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Biography">Biography</option>
              <option value="History">History</option>
              <option value="Self-Help">Self-Help</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
            >
              <option value="">Select Subject</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Engineering">Engineering</option>
              <option value="Business">Business</option>
              <option value="Literature">Literature</option>
              <option value="Psychology">Psychology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Medicine">Medicine</option>
              <option value="Law">Law</option>
              <option value="Arts">Arts</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Condition *</label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
            >
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Worn">Worn</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="swapOnly"
                checked={formData.swapOnly}
                onChange={handleChange}
                style={{ marginRight: '8px' }}
              />
              Swap Only (no selling)
            </label>
          </div>

          {!formData.swapOnly && (
            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          )}

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Add Book
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBook;