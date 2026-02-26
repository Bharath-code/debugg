/**
 * User Repository
 * Database operations for user management
 */

import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/crypto.js';

export type UserRole = 'ADMIN' | 'DEVELOPER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  active: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
}

export interface CreateUserInput {
  email: string;
  name?: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  active?: boolean;
  emailVerified?: boolean;
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email: input.email }
  });
  
  if (existing) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const passwordHash = await hashPassword(input.password);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role || 'VIEWER',
      active: true,
      emailVerified: false,
    }
  });
  
  return userToDto(user);
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id }
  });
  
  return user ? userToDto(user) : null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  return user ? userToDto(user) : null;
}

/**
 * Verify user password
 */
export async function verifyUserPassword(email: string, password: string): Promise<{ user: User; valid: boolean }> {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user || !user.passwordHash) {
    return { user: null as any, valid: false };
  }
  
  const valid = await verifyPassword(password, user.passwordHash);
  
  if (valid) {
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      }
    });
  }
  
  return { user: userToDto(user), valid };
}

/**
 * Update user
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const user = await prisma.user.update({
    where: { id },
    data: input
  });
  
  return userToDto(user);
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({
    where: { id }
  });
}

/**
 * List users with pagination
 */
export async function listUsers(options: {
  page?: number;
  limit?: number;
  role?: UserRole;
  active?: boolean;
}): Promise<{ users: User[]; total: number }> {
  const { page = 1, limit = 20, role, active } = options;
  const skip = (page - 1) * limit;
  
  const where: any = {};
  if (role) where.role = role;
  if (active !== undefined) where.active = active;
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);
  
  return {
    users: users.map(userToDto),
    total
  };
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  const [total, byRole, active] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: true
    }),
    prisma.user.count({ where: { active: true } })
  ]);
  
  return {
    total,
    byRole: Object.fromEntries(byRole.map(r => [r.role, r._count])),
    active,
    inactive: total - active
  };
}

export interface UserStats {
  total: number;
  byRole: Record<string, number>;
  active: number;
  inactive: number;
}

/**
 * Create user session
 */
export async function createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  await prisma.session.create({
    data: {
      userId,
      token,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });
  
  return token;
}

/**
 * Get session
 */
export async function getSession(token: string): Promise<Session | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });
  
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  return {
    id: session.id,
    userId: session.userId,
    token: session.token,
    expiresAt: session.expiresAt,
    user: userToDto(session.user)
  };
}

/**
 * Delete session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.delete({
    where: { token }
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
  
  return result.count;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  user: User;
}

// Helper: Convert Prisma user to DTO
function userToDto(user: any): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    active: user.active,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    lastLoginIp: user.lastLoginIp,
  };
}
