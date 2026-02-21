// ADD THIS: not-found and global error middleware
import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { AppError } from './appError.js'

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404))
}

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  void _next

  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      issues: error.flatten(),
    })
    return
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message })
    return
  }

  logger.error({ error }, 'Unhandled error')
  res.status(500).json({
    message: 'Internal server error',
    ...(env.NODE_ENV !== 'production' && error instanceof Error ? { details: error.message } : {}),
  })
}
