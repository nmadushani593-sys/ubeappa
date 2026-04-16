import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return undefined;
    }

    const socket = io('/', { withCredentials: true });
    socketRef.current = socket;
    socket.emit('agent:join', user._id || user.id);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return <SocketContext.Provider value={socketRef}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
