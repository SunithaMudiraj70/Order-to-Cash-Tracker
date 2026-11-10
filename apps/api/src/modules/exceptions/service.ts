// ==============================================================================
// Module: Exceptions Service
// TODO (Step 3): Implement detector output ingestion and ground-truth comparison
// ==============================================================================

export class ExceptionService {
  async listExceptions() {
    // TODO: Query detected anomalies
    return [];
  }

  async getGroundTruthBenchmarks() {
    // TODO: Query gt.ground_truth table
    return [];
  }
}

export const exceptionService = new ExceptionService();

