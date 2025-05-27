import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = '伺服器內部錯誤';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.message) {
    // 處理已知的業務邏輯錯誤
    if (error.message.includes('不存在') || error.message.includes('找不到')) {
      statusCode = 404;
      message = error.message;
    } else if (error.message.includes('不能為空') || error.message.includes('無效') || error.message.includes('必須')) {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes('庫存不足')) {
      statusCode = 400;
      message = error.message;
    } else {
      message = error.message;
    }
  }

  console.error('🚨 錯誤詳情:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(statusCode).json({
    success: false,
    error: message
  });
};

export const notFoundHandler = (req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    error: `路由 ${req.originalUrl} 不存在`
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
