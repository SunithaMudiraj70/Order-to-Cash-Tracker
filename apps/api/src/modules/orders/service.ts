// ==============================================================================
// Module: Orders Service
// TODO (Step 3): Implement order lifecycle transitions and promised date tracking
// ==============================================================================

export class OrderService {
  async listOrders() {
    // TODO: Query o2c.sales_order
    return [];
  }

  async getOrderById(_orderId: string) {
    // TODO: Query sales order by SO-2026-XXXXXX
    return null;
  }
}

export const orderService = new OrderService();

