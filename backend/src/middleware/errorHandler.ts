import { Request, Response, NextFunction } from 'express';
import { handleError } from '../utils/errors';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  handleError(err, req, res, next);
};


