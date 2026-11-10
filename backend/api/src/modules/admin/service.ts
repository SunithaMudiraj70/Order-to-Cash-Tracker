/**
 * PURPOSE: Service layer orchestrating user profile retrieval and role modifications
 * INPUT: userId, role input
 * RETURNS: Promise<UserProfileRecord[]>, Promise<UserProfileRecord>
 * ERRORS: throws Error if user not found
 */

import {
  UserProfileRecord,
  findUserById,
  queryAllUsers,
  updateUserRole
} from './repo.js';
import { UpdateRoleInput } from './schemas.js';

export async function listAllUsers(): Promise<UserProfileRecord[]> {
  return queryAllUsers();
}

export async function changeUserRole(
  id: string,
  input: UpdateRoleInput
): Promise<UserProfileRecord> {
  const existing = await findUserById(id);
  if (!existing) {
    throw new Error(`User with ID ${id} not found`);
  }
  return updateUserRole(id, input.role);
}

