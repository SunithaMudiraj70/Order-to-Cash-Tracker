// ==============================================================================
// Module: Quotes Service
// TODO (Step 3): Implement quote business logic and quote line summation
// ==============================================================================

export class QuoteService {
  async listQuotes() {
    // TODO: Query o2c.quote table
    return [];
  }

  async getQuoteWithLines(_quoteId: string) {
    // TODO: Query o2c.quote joined with o2c.quote_line
    return null;
  }
}

export const quoteService = new QuoteService();

