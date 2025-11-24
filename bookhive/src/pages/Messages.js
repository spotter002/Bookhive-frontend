import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import api from '../utils/api';

const Messages = () => {
  const { user, token } = useAuth();
  const socket = useSocket(token);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      if (socket?.current) {
        socket.current.emit('join_chat', selectedChat._id);
        socket.current.emit('mark_read', { chatId: selectedChat._id });
      }
    }
  }, [selectedChat, socket]);

  useEffect(() => {
    if (!socket?.current) return;
    
    const s = socket.current;
    
    s.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
      setChats(prev => prev.map(chat => 
        chat._id === message.chatId 
          ? { ...chat, updatedAt: new Date() }
          : chat
      ));
    });

    s.on('messages_read', ({ chatId }) => {
      if (selectedChat?._id === chatId) {
        setMessages(prev => prev.map(m => ({ ...m, read: true })));
      }
    });

    s.on('typing_status', ({ userId, typing }) => {
      setTypingUsers(prev => 
        typing 
          ? [...prev.filter(id => id !== userId), userId]
          : prev.filter(id => id !== userId)
      );
    });

    return () => {
      s.off('receive_message');
      s.off('messages_read');
      s.off('typing_status');
    };
  }, [socket, selectedChat]);

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
    if (!newMessage.trim() || !selectedChat || !socket?.current) return;

    socket.current.emit('send_message', {
      chatId: selectedChat._id,
      content: newMessage
    });
    
    setNewMessage('');
    handleStopTyping();
  };

  const handleTyping = () => {
    if (!socket?.current || !selectedChat) return;
    
    socket.current.emit('typing', { chatId: selectedChat._id });
    
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => {
      handleStopTyping();
    }, 1000));
  };

  const handleStopTyping = () => {
    if (!socket?.current || !selectedChat) return;
    socket.current.emit('stop_typing', { chatId: selectedChat._id });
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
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
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {chat.bookId?.title}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      with {otherUser?.name}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        backgroundColor: 'var(--primary-yellow)',
                        color: 'var(--jet-black)',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        {chat.unreadCount}
                      </span>
                    )}
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
                        opacity: 0.7,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                        {message.senderId._id === user.id && (
                          <span>{message.read ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {typingUsers.length > 0 && (
                  <div style={{ padding: '0.5rem', fontStyle: 'italic', color: '#666' }}>
                    {getOtherParticipant(selectedChat)?.name} is typing...
                  </div>
                )}
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
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
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