// ==============================================================================
// Module: Shipments Service
// TODO (Step 3): Implement shipment dispatch logic and order line quantity reconciliation
// ==============================================================================

export class ShipmentService {
  async listShipments() {
    // TODO: Query o2c.shipment
    return [];
  }

  async getShipmentById(_shipmentId: string) {
    // TODO: Query shipment by SHP-2026-XXXXXX
    return null;
  }
}

export const shipmentService = new ShipmentService();

