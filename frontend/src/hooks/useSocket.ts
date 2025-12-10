import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useSocket = (proyectoId: number | null) => {
  const { usuario, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!proyectoId || !token || !usuario) return;

    // Conectar al servidor Socket.io
    const socket = io(API_URL.replace('/api', ''), {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Unirse a la sala del proyecto
    socket.emit('join-project', proyectoId);

    // Limpiar al desmontar
    return () => {
      socket.emit('leave-project', proyectoId);
      socket.disconnect();
    };
  }, [proyectoId, token, usuario]);

  return socketRef.current;
};




