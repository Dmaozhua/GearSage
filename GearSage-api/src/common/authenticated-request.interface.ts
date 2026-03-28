import type { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  phone: string;
  isAdmin?: boolean;
  status?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface AuthenticatedAdmin {
  id: number;
  username: string;
  role: string;
}

export interface AuthenticatedAdminRequest extends Request {
  admin?: AuthenticatedAdmin;
}
