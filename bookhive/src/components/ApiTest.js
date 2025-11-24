import React, { useState } from 'react';
import api from '../utils/api';

const ApiTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint, method = 'GET', requiresAuth = false) => {
    try {
      setLoading(true);
      let response;
      
      if (method === 'GET') {
        response = await api.get(endpoint);
      }
      
      setTestResults(prev => ({
        ...prev,
        [endpoint]: { status: 'success', data: response.data }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [endpoint]: { 
          status: 'error', 
          error: error.response?.status || 'Network Error',
          message: error.response?.data?.message || error.message 
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testEndpoints = [
    { endpoint: '/api/books', label: 'Get Books' },
    { endpoint: '/api/auth/profile', label: 'Get Profile (requires auth)', requiresAuth: true }
  ];

  return (
    <div style={{ padding: '2rem', border: '1px solid #ddd', margin: '1rem', borderRadius: '8px' }}>
      <h3>API Connection Test</h3>
      <p>Backend URL: https://bookhive-backend-zdho.onrender.com</p>
      
      <div style={{ marginBottom: '1rem' }}>
        {testEndpoints.map(({ endpoint, label, requiresAuth }) => (
          <button
            key={endpoint}
            onClick={() => testEndpoint(endpoint, 'GET', requiresAuth)}
            disabled={loading}
            style={{ margin: '0.5rem', padding: '0.5rem 1rem' }}
          >
            Test {label}
          </button>
        ))}
      </div>

      <div>
        <h4>Test Results:</h4>
        {Object.entries(testResults).map(([endpoint, result]) => (
          <div key={endpoint} style={{ 
            margin: '0.5rem 0', 
            padding: '0.5rem', 
            backgroundColor: result.status === 'success' ? '#d4edda' : '#f8d7da',
            border: `1px solid ${result.status === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px'
          }}>
            <strong>{endpoint}:</strong> 
            {result.status === 'success' ? (
              <span style={{ color: 'green' }}> ✓ Success</span>
            ) : (
              <span style={{ color: 'red' }}> ✗ Error {result.error}: {result.message}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiTest;