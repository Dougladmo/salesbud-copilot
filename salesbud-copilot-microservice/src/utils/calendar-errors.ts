import { AppError } from './app-error.js';

export class CalendarAuthError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class CalendarConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class CalendarApiError extends AppError {
  constructor(message: string, statusCode = 502) {
    super(message, statusCode);
  }
}
