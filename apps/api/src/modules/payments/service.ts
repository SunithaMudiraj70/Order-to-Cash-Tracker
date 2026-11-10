// ==============================================================================
// Module: Payments Service
// TODO (Step 3): Implement payment allocation ledgering and invoice balance updates
// ==============================================================================

export class PaymentService {
  async listPayments() {
    // TODO: Query o2c.payment
    return [];
  }

  async getPaymentById(_paymentId: string) {
    // TODO: Query payment by PAY-2026-XXXXXX
    return null;
  }
}

export const paymentService = new PaymentService();

