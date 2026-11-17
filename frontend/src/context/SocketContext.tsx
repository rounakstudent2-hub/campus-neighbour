import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Notification } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  recentNotification: Notification | null;
  clearRecentNotification: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  recentNotification: null,
  clearRecentNotification: () => {}
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [recentNotification, setRecentNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const newSocket = io('/', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (user?.id) {
        newSocket.emit('join_user', user.id);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('notification', (notif: Notification) => {
      setRecentNotification(notif);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit('join_user', user.id);
    }
  }, [user?.id, socket, isConnected]);

  const clearRecentNotification = () => setRecentNotification(null);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        recentNotification,
        clearRecentNotification
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
