// ==============================================================================
// Module: Accounts Service
// TODO (Step 3): Implement Supabase database queries for o2c.account
// ==============================================================================

export class AccountService {
  async listAccounts() {
    // TODO: Query o2c.account table
    return [];
  }

  async getAccountById(_id: string) {
    // TODO: Query single account by ACC-XXXXXX
    return null;
  }
}

export const accountService = new AccountService();

