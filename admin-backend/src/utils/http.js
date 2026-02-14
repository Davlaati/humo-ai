export class AppError extends Error {
  constructor(status, message, code = 'APP_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
