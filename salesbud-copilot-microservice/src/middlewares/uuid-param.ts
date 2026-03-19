import type { Request, Response, NextFunction } from 'express';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuidParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    const str = Array.isArray(value) ? value[0] : (value as string);
    if (!str || !uuidRegex.test(str)) {
      res.status(400).json({ error: `Invalid UUID for parameter '${paramName}'` });
      return;
    }
    next();
  };
}
