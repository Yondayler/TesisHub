import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './env';

interface JwtPayload {
  id: number;
  email: string;
  rol: string;
  nombre?: string;
  apellido?: string;
}

let io: SocketServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware de autenticación para Socket.io
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Token no proporcionado'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      (socket as any).usuario = decoded;
      next();
    } catch (error) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const usuario = (socket as any).usuario;
    console.log(`Usuario conectado: ${usuario.email} (${usuario.id})`);

    // Unirse a la sala del proyecto
    socket.on('join-project', (proyectoId: number) => {
      const room = `proyecto-${proyectoId}`;
      socket.join(room);
      console.log(`Usuario ${usuario.email} se unió a ${room}`);
    });

    // Salir de la sala del proyecto
    socket.on('leave-project', (proyectoId: number) => {
      const room = `proyecto-${proyectoId}`;
      socket.leave(room);
      console.log(`Usuario ${usuario.email} salió de ${room}`);
    });

    // Enviar mensaje
    socket.on('send-message', (data: { proyectoId: number; comentario: string; tipo_comentario?: string }) => {
      const room = `proyecto-${data.proyectoId}`;
      io!.to(room).emit('new-message', {
        ...data,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre || '',
          apellido: usuario.apellido || '',
          email: usuario.email,
          rol: usuario.rol
        },
        timestamp: new Date().toISOString()
      });
    });

    // Indicador de "escribiendo..."
    socket.on('typing', (data: { proyectoId: number; usuarioId: number; usuarioNombre?: string }) => {
      const room = `proyecto-${data.proyectoId}`;
      socket.to(room).emit('user-typing', {
        usuarioId: data.usuarioId,
        usuarioNombre: data.usuarioNombre || usuario.nombre || 'Usuario'
      });
    });

    socket.on('stop-typing', (data: { proyectoId: number; usuarioId: number }) => {
      const room = `proyecto-${data.proyectoId}`;
      socket.to(room).emit('user-stopped-typing', {
        usuarioId: data.usuarioId
      });
    });

    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${usuario.email}`);
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io no inicializado');
  }
  return io;
};

