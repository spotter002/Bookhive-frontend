import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Messages = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const response = await api.get('/api/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await api.get(`/api/chats/${chatId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const response = await api.post(`/api/chats/${selectedChat._id}/messages`, {
        content: newMessage
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p._id !== user.id);
  };

  if (!user) {
    return (
      <div className="container">
        <p>Please login to view messages.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="container">Loading messages...</div>;
  }

  return (
    <div className="container" style={{ marginTop: '2rem', maxWidth: '1200px' }}>
      <h2 style={{ marginBottom: '2rem', color: 'var(--jet-black)' }}>💬 Messages</h2>
      
      <div style={{ display: 'flex', height: '600px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Chat List */}
        <div style={{ width: '300px', borderRight: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #ddd', backgroundColor: 'var(--primary-yellow)' }}>
            <h4 style={{ margin: 0, color: 'var(--jet-black)' }}>Conversations</h4>
          </div>
          
          <div style={{ overflowY: 'auto', height: 'calc(100% - 60px)' }}>
            {chats.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                <p>No conversations yet</p>
                <p style={{ fontSize: '0.9rem' }}>Start messaging book owners!</p>
              </div>
            ) : (
              chats.map(chat => {
                const otherUser = getOtherParticipant(chat);
                return (
                  <div
                    key={chat._id}
                    onClick={() => setSelectedChat(chat)}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedChat?._id === chat._id ? '#e3f2fd' : 'white',
                      ':hover': { backgroundColor: '#f5f5f5' }
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {chat.bookId?.title}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      with {otherUser?.name}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div style={{ 
                padding: '1rem', 
                borderBottom: '1px solid #ddd', 
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--jet-black)' }}>
                    {selectedChat.bookId?.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                    with {getOtherParticipant(selectedChat)?.name}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '1rem',
                backgroundColor: '#f8f9fa'
              }}>
                {messages.map(message => (
                  <div
                    key={message._id}
                    style={{
                      marginBottom: '1rem',
                      display: 'flex',
                      justifyContent: message.senderId._id === user.id ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '0.75rem 1rem',
                        borderRadius: '18px',
                        backgroundColor: message.senderId._id === user.id ? 'var(--primary-yellow)' : 'white',
                        color: message.senderId._id === user.id ? 'var(--jet-black)' : '#333',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ fontSize: '0.9rem' }}>{message.content}</div>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        marginTop: '0.25rem',
                        opacity: 0.7
                      }}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} style={{ 
                padding: '1rem', 
                borderTop: '1px solid #ddd',
                backgroundColor: 'white',
                display: 'flex',
                gap: '0.5rem'
              }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--primary-yellow)',
                    color: 'var(--jet-black)',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#666'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;