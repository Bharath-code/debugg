/**
 * WebSocket Server for Real-time Updates
 * Using Socket.io for live error streaming and notifications
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export interface SocketIOClient {
  id: string;
  userId?: string;
  projectId?: string;
  rooms: string[];
}

class WebSocketServer {
  private io: SocketIOServer;
  private clients: Map<string, SocketIOClient> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.setupCleanup();
    
    logger.info('[WebSocket] Server initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info('[WebSocket] Client connected', { socketId: socket.id });

      // Handle authentication
      socket.on('authenticate', (data: { userId?: string; projectId?: string; token?: string }) => {
        const client: SocketIOClient = {
          id: socket.id,
          userId: data.userId,
          projectId: data.projectId,
          rooms: []
        };

        this.clients.set(socket.id, client);

        // Join project room if specified
        if (data.projectId) {
          socket.join(`project:${data.projectId}`);
          client.rooms.push(`project:${data.projectId}`);
        }

        // Join user-specific room
        if (data.userId) {
          socket.join(`user:${data.userId}`);
          client.rooms.push(`user:${data.userId}`);
        }

        logger.info('[WebSocket] Client authenticated', { socketId: socket.id, userId: data.userId });

        socket.emit('authenticated', { success: true });
      });

      // Handle subscribing to error updates
      socket.on('subscribe:errors', (data: { projectId?: string }) => {
        if (data.projectId) {
          socket.join(`errors:${data.projectId}`);
          logger.info('[WebSocket] Client subscribed to errors', { 
            socketId: socket.id, 
            projectId: data.projectId 
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.clients.delete(socket.id);
        logger.info('[WebSocket] Client disconnected', { socketId: socket.id });
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        logger.error('[WebSocket] Client error', { socketId: socket.id, error: error.message });
      });
    });
  }

  private setupCleanup(): void {
    // Clean up stale connections every 5 minutes
    setInterval(() => {
      const staleClients: string[] = [];
      
      this.clients.forEach((client, socketId) => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (!socket || !socket.connected) {
          staleClients.push(socketId);
        }
      });

      staleClients.forEach(socketId => {
        this.clients.delete(socketId);
        logger.info('[WebSocket] Cleaned up stale client', { socketId });
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Broadcast new error to subscribers
   */
  broadcastError(error: any, projectId?: string): void {
    const payload = {
      type: 'NEW_ERROR',
      data: error,
      timestamp: new Date().toISOString()
    };

    if (projectId) {
      // Broadcast to project room
      this.io.to(`errors:${projectId}`).emit('error:created', payload);
      logger.debug('[WebSocket] Broadcast error to project', { projectId });
    } else {
      // Broadcast to all
      this.io.emit('error:created', payload);
      logger.debug('[WebSocket] Broadcast error to all');
    }
  }

  /**
   * Send notification to specific user
   */
  notifyUser(userId: string, notification: NotificationPayload): void {
    this.io.to(`user:${userId}`).emit('notification', notification);
    logger.debug('[WebSocket] Sent notification to user', { userId });
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(type: string, data: any): void {
    this.io.emit(type, data);
    logger.debug('[WebSocket] Broadcast', { type });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get statistics
   */
  getStats(): WebSocketStats {
    return {
      connectedClients: this.clients.size,
      rooms: Array.from(new Set([...this.clients.values()].flatMap(c => c.rooms))).length
    };
  }
}

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

export interface WebSocketStats {
  connectedClients: number;
  rooms: number;
}

// Singleton instance
let webSocketServer: WebSocketServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer): WebSocketServer {
  if (!webSocketServer) {
    webSocketServer = new WebSocketServer(httpServer);
  }
  return webSocketServer;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): WebSocketServer | null {
  return webSocketServer;
}

/**
 * Broadcast error created event
 */
export function broadcastErrorCreated(error: any, projectId?: string): void {
  if (webSocketServer) {
    webSocketServer.broadcastError(error, projectId);
  }
}

/**
 * Send notification to user
 */
export function sendUserNotification(userId: string, notification: NotificationPayload): void {
  if (webSocketServer) {
    webSocketServer.notifyUser(userId, notification);
  }
}
