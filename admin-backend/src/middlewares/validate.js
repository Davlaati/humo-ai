import { AppError } from '../utils/http.js';

export const validate = (schema, target = 'body') => (req, _res, next) => {
  const parsed = schema.safeParse(req[target]);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return next(new AppError(400, `Validation failed: ${details}`, 'VALIDATION_ERROR'));
  }
  req[target] = parsed.data;
  return next();
};
