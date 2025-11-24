import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(token) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    
    const socket = io(process.env.REACT_APP_API_BASE_URL || 'https://bookhive-backend-zdho.onrender.com', {
      auth: { token }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return socketRef;
}