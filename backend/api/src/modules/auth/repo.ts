/**
 * PURPOSE: Data access repository for user profile queries
 * INPUT: userId: string
 * RETURNS: Promise<UserProfile | null>
 * ERRORS: throws Error on database failure
 */

import { sql } from '../../db/client.js';
import { UserProfile } from './schemas.js';

/**
 * PURPOSE: Query user profile record by user UUID
 * INPUT: userId: string
 * RETURNS: Promise<UserProfile | null>
 * ERRORS: throws on database execution failure
 */
export async function findProfileById(userId: string): Promise<UserProfile | null> {
  const [row] = await sql<UserProfile[]>`
    SELECT id, email, role, full_name, account_id
    FROM o2c.profiles
    WHERE id = ${userId}
  `;
  return row || null;
}
