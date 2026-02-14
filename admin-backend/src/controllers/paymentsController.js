import { getPayments, refundPayment, verifyPayment } from '../services/paymentService.js';
import { ok } from '../utils/http.js';

export async function listPaymentsController(req, res, next) {
  try {
    return ok(res, await getPayments(req.query));
  } catch (error) {
    return next(error);
  }
}

export async function verifyPaymentController(req, res, next) {
  try {
    return ok(res, await verifyPayment(req.params.id, req.admin.sub));
  } catch (error) {
    return next(error);
  }
}

export async function refundPaymentController(req, res, next) {
  try {
    return ok(res, await refundPayment(req.params.id, req.admin.sub));
  } catch (error) {
    return next(error);
  }
}
