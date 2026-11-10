// ==============================================================================
// Module: Auth Service
// TODO (Step 3): Implement user role resolution and session token handling
// ==============================================================================

export class AuthService {
  async getProfile(_userId: string) {
    // TODO: Query o2c.profiles by auth user ID
    return null;
  }
}

export const authService = new AuthService();

