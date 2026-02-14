export interface CreateInvoiceResponse {
  success: boolean;
  mode: 'demo' | 'real';
  paymentId: number;
  starsAmount: number;
  invoiceLink?: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function createStarsInvoice(payload: { telegramId: string; username?: string; packageKey: string }) {
  const response = await fetch(`${API_BASE}/api/payments/create-invoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function simulatePaymentSuccess(paymentId: number) {
  const response = await fetch(`${API_BASE}/api/payments/simulate-success`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });
  return response.json();
}

export async function getStarsBalance(telegramId: string) {
  const response = await fetch(`${API_BASE}/api/payments/balance/${telegramId}`);
  return response.json();
}
