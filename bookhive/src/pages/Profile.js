import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Profile = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', location: '' });
  const [userBooks, setUserBooks] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchUserData();
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to fetch user profile from database
      try {
        const profileResponse = await api.get('/api/auth/profile');
        setProfile(profileResponse.data);
        setFormData({
          name: profileResponse.data.name || '',
          bio: profileResponse.data.bio || '',
          location: profileResponse.data.location || ''
        });
      } catch (profileError) {
        // If profile endpoint doesn't exist, use user data from context
        if (profileError.response?.status === 404) {
          setProfile({
            name: user?.name || 'User',
            email: user?.email || 'No email',
            bio: '',
            location: '',
            avatar: ''
          });
          setFormData({
            name: user?.name || '',
            bio: '',
            location: ''
          });
        } else {
          throw profileError;
        }
      }
      
      // Fetch user books
      const booksResponse = await api.get('/api/books/my-books');
      setUserBooks(booksResponse.data || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to load data. Please check your connection or redeploy backend with latest code.');
      }
    } finally {
      setLoading(false);
    }
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
      let updateData = { ...formData };
      
      // Upload avatar if selected
      const imageInput = document.querySelector('#avatarInput');
      if (imageInput && imageInput.files[0]) {
        const imageUrl = await handleImageUpload(imageInput.files[0]);
        updateData.avatar = imageUrl;
      }
      
      // Try to update user profile in database
      try {
        await api.put('/api/auth/profile', updateData);
      } catch (updateError) {
        if (updateError.response?.status === 404) {
          console.warn('Profile update endpoint not available');
        } else {
          throw updateError;
        }
      }
      
      await fetchUserData();
      await fetchUserData();
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!user) {
    return (
      <div className="container">
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ color: 'red', textAlign: 'center' }}>
          <p>Error: {error}</p>
          <button onClick={fetchUserData} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="container">No profile data found.</div>;
  }

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>My Profile</h2>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--primary-yellow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            fontSize: '2rem',
            backgroundImage: profile.avatar ? `url(${profile.avatar})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            {!profile.avatar && '👤'}
          </div>
        </div>

        {!editing ? (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Name:</strong> {profile.name}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Email:</strong> {profile.email}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Bio:</strong> {profile.bio || 'No bio added'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Location:</strong> {profile.location || 'No location added'}
            </div>
            <button onClick={() => setEditing(true)} className="btn-primary">
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Profile Picture</label>
              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const preview = document.querySelector('.profile-avatar');
                      if (preview) {
                        preview.style.backgroundImage = `url(${event.target.result})`;
                      }
                    };
                    reader.readAsDataURL(e.target.files[0]);
                  }
                }}
              />
            </div>
            
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn-primary">Save Changes</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>My Books ({userBooks.length})</h3>
            {userBooks.length > 0 && (
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="author">Author A-Z</option>
                <option value="condition">Condition</option>
              </select>
            )}
          </div>
          {userBooks.length > 0 ? (
            <div style={{ marginTop: '1rem' }}>
              {userBooks
                .sort((a, b) => {
                  switch(sortBy) {
                    case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
                    case 'title': return a.title.localeCompare(b.title);
                    case 'author': return a.author.localeCompare(b.author);
                    case 'condition': return a.condition.localeCompare(b.condition);
                    default: return new Date(b.createdAt) - new Date(a.createdAt);
                  }
                })
                .map(book => (
                <div key={book._id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  marginBottom: '1rem',
                  backgroundColor: 'white'
                }}>
                  {book.imageUrl && (
                    <img 
                      src={book.imageUrl} 
                      alt={book.title}
                      style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px', marginRight: '1rem' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{book.title}</h4>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}><strong>Author:</strong> {book.author}</p>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}><strong>Condition:</strong> {book.condition}</p>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}><strong>Price:</strong> {book.swapOnly ? 'Swap Only' : `$${book.price}`}</p>
                  </div>
                  <Link to={`/book/${book._id}`} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p>You haven't listed any books yet. <Link to="/add-book">Add your first book!</Link></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;