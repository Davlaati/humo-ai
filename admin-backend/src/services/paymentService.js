import { withTransaction } from '../config/db.js';
import { addAdminLog } from '../repositories/adminRepository.js';
import { addSystemLog } from '../repositories/metricsRepository.js';
import { getPaymentById, listPayments, setPaymentStatus } from '../repositories/paymentRepository.js';
import { incrementUserBalance } from '../repositories/userRepository.js';
import { AppError } from '../utils/http.js';

export async function getPayments(query) {
  return listPayments(query);
}

export async function verifyPayment(paymentId, adminId) {
  return withTransaction(async (client) => {
    const payment = await getPaymentById(paymentId, client);
    if (!payment) throw new AppError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    if (payment.status === 'paid') return { payment, idempotent: true };
    if (payment.status === 'refunded') throw new AppError(409, 'Refunded payment cannot be verified', 'INVALID_PAYMENT_STATE');

    const updatedPayment = await setPaymentStatus(paymentId, 'paid', client);
    const user = await incrementUserBalance(payment.user_id, payment.amount, client);

    await addSystemLog('payment_verified', `Payment ${paymentId} verified`, { paymentId, userId: payment.user_id }, client);
    await addAdminLog(adminId, 'payment_verify', paymentId, client);

    return { payment: updatedPayment, userBalance: user.balance, idempotent: false };
  });
}

export async function refundPayment(paymentId, adminId) {
  return withTransaction(async (client) => {
    const payment = await getPaymentById(paymentId, client);
    if (!payment) throw new AppError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    if (payment.status === 'refunded') return { payment, idempotent: true };

    const updatedPayment = await setPaymentStatus(paymentId, 'refunded', client);

    await addSystemLog('payment_refunded', `Payment ${paymentId} refunded`, { paymentId, userId: payment.user_id }, client);
    await addAdminLog(adminId, 'payment_refund', paymentId, client);

    return { payment: updatedPayment, idempotent: false };
  });
}
