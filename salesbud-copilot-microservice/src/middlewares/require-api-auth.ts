import { getAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';

export function requireApiAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  next();
}
