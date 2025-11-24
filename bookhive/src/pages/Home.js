import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Home = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [filters, setFilters] = useState({ genre: '', subject: '', condition: '' });
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await api.get('/api/books');
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSearch = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.genre) params.append('genre', filters.genre);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.condition) params.append('condition', filters.condition);
      if (sortBy) params.append('sortBy', sortBy);
      
      const response = await api.get(`/api/books?${params}`);
      setBooks(response.data);
    } catch (error) {
      console.error('Error searching books:', error);
    }
  };

  const handleAuthorSearch = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (authorSearch) params.append('author', authorSearch);
      params.append('sortBy', 'genre');
      
      const response = await api.get(`/api/books?${params}`);
      setBooks(response.data);
      setSortBy('genre');
    } catch (error) {
      console.error('Error searching by author:', error);
    }
  };

  const handleSortChange = async (e) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (authorSearch) params.append('author', authorSearch);
      if (filters.genre) params.append('genre', filters.genre);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.condition) params.append('condition', filters.condition);
      if (newSortBy) params.append('sortBy', newSortBy);
      
      const response = await api.get(`/api/books?${params}`);
      setBooks(response.data);
    } catch (error) {
      console.error('Error sorting books:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const categorizeBooks = (books, sortBy, hasAuthorSearch) => {
    if (!sortBy || !books.length) return { 'All Books': books };
    
    const categories = {};
    
    books.forEach(book => {
      let categoryKey;
      
      if (hasAuthorSearch && authorSearch) {
        categoryKey = book.genre && book.genre.trim() !== '' ? book.genre : 'Other';
      } else if (sortBy.includes('price')) {
        const price = book.price || 0;
        if (book.swapOnly) categoryKey = 'Swap Only';
        else if (price === 0) categoryKey = 'Free';
        else if (price <= 10) categoryKey = '$0-10';
        else if (price <= 25) categoryKey = '$10-25';
        else if (price <= 50) categoryKey = '$25-50';
        else if (price <= 100) categoryKey = '$50-100';
        else categoryKey = '$100+';
      } else if (sortBy === 'genre') {
        categoryKey = book.genre && book.genre.trim() !== '' ? book.genre : 'Other';
      } else if (sortBy === 'subject') {
        categoryKey = book.subject && book.subject.trim() !== '' ? book.subject : 'Other';
      } else if (sortBy.includes('author')) {
        const firstLetter = book.author?.charAt(0).toUpperCase() || '#';
        categoryKey = `Authors: ${firstLetter}`;
      } else if (sortBy.includes('title')) {
        const firstLetter = book.title?.charAt(0).toUpperCase() || '#';
        categoryKey = `Titles: ${firstLetter}`;
      } else {
        categoryKey = 'All Books';
      }
      
      if (!categories[categoryKey]) categories[categoryKey] = [];
      categories[categoryKey].push(book);
    });
    
    return categories;
  };

  const categorizedBooks = categorizeBooks(books, sortBy, authorSearch.trim() !== '');

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <h1 style={{ color: 'var(--jet-black)', marginBottom: '1rem' }}>
          Welcome to BookHive 📚
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          Your community book exchange platform
        </p>
        <div style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '2rem' }}>
          <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#666' }}>
            Connect with fellow book lovers in your community! BookHive makes it easy to swap, sell, or find your next great read. 
            Whether you're a student looking for textbooks or someone wanting to share their personal library, 
            our platform brings readers together. Save money, reduce waste, and discover new books through our vibrant community.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
              <p><strong>Save Money</strong><br/>Find affordable books</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌱</div>
              <p><strong>Go Green</strong><br/>Reuse and recycle books</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤝</div>
              <p><strong>Build Community</strong><br/>Connect with local readers</p>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleBookSearch} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search books by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  padding: '12px', 
                  width: '250px', 
                  border: '2px solid var(--primary-yellow)',
                  borderRadius: '8px'
                }}
              />
              <button type="submit" className="btn-primary">Search Books</button>
            </div>
          </form>
          
          <form onSubmit={handleAuthorSearch}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by author name..."
                value={authorSearch}
                onChange={(e) => setAuthorSearch(e.target.value)}
                style={{ 
                  padding: '12px', 
                  width: '250px', 
                  border: '2px solid var(--primary-yellow)',
                  borderRadius: '8px'
                }}
              />
              <button type="submit" className="btn-secondary">Search by Author</button>
            </div>
          </form>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <select
              name="genre"
              value={filters.genre}
              onChange={handleFilterChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">All Genres</option>
              <option value="Fiction">Fiction</option>
              <option value="Non-Fiction">Non-Fiction</option>
              <option value="Mystery">Mystery</option>
              <option value="Romance">Romance</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Biography">Biography</option>
              <option value="History">History</option>
              <option value="Self-Help">Self-Help</option>
            </select>
            
            <select
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">All Subjects</option>
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
            </select>
            
            <select
              name="condition"
              value={filters.condition}
              onChange={handleFilterChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">All Conditions</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Worn">Worn</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold' }}>Sort by:</label>
            <select
              value={sortBy}
              onChange={handleSortChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
            >
              <option value="">Newest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="author-asc">Author A-Z</option>
              <option value="author-desc">Author Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
              <option value="genre">Genre</option>
              <option value="subject">Subject</option>
            </select>
          </div>
        </div>
      </div>

      {Object.entries(categorizedBooks).map(([category, categoryBooks]) => (
        <div key={category} style={{ marginBottom: '3rem' }}>
          <h2 style={{ 
            color: 'var(--jet-black)', 
            marginBottom: '1.5rem', 
            paddingBottom: '0.5rem',
            borderBottom: '3px solid var(--primary-yellow)',
            display: 'inline-block'
          }}>
            {category} ({categoryBooks.length})
          </h2>
          
          <div className="book-grid">
            {categoryBooks.map(book => (
              <div key={book._id} className="card">
                {book.imageUrl && (
                  <img 
                    src={book.imageUrl} 
                    alt={book.title}
                    style={{ 
                      width: '100%', 
                      height: '200px', 
                      objectFit: 'cover', 
                      borderRadius: '8px', 
                      marginBottom: '1rem' 
                    }}
                  />
                )}
                <h3>{book.title}</h3>
                <p><strong>Author:</strong> {book.author}</p>
                {book.genre && <p><strong>Genre:</strong> {book.genre}</p>}
                {book.subject && <p><strong>Subject:</strong> {book.subject}</p>}
                <p><strong>Condition:</strong> {book.condition}</p>
                <p><strong>Price:</strong> {book.swapOnly ? 'Swap Only' : `$${book.price}`}</p>
                <Link to={`/book/${book._id}`} className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}

      {books.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No books found. Be the first to add a book!</p>
        </div>
      )}

      <Link to="/add-book" className="floating-btn">+</Link>
    </div>
  );
};

export default Home;