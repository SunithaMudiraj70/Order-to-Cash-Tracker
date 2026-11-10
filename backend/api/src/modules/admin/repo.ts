/**
 * PURPOSE: Data access repository querying and updating user profile accounts
 * INPUT: userId, role
 * RETURNS: Promise<UserProfileRecord[]>, Promise<UserProfileRecord | null>
 * ERRORS: throws on database failure
 */

import { sql } from '../../db/client.js';

export interface UserProfileRecord {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  account_id: string | null;
  created_at: string;
}

export async function queryAllUsers(): Promise<UserProfileRecord[]> {
  return sql<UserProfileRecord[]>`
    SELECT id, email, role, full_name, account_id, created_at
    FROM o2c.profiles
    ORDER BY email ASC
  `;
}

export async function findUserById(id: string): Promise<UserProfileRecord | null> {
  const [row] = await sql<UserProfileRecord[]>`
    SELECT id, email, role, full_name, account_id, created_at
    FROM o2c.profiles
    WHERE id = ${id}
    LIMIT 1
  `;
  return row || null;
}

export async function updateUserRole(id: string, role: string): Promise<UserProfileRecord> {
  const [row] = await sql<UserProfileRecord[]>`
    UPDATE o2c.profiles
    SET role = ${role}
    WHERE id = ${id}
    RETURNING id, email, role, full_name, account_id, created_at
  `;
  return row;
}

