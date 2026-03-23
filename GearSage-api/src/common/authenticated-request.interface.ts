import type { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  phone: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
