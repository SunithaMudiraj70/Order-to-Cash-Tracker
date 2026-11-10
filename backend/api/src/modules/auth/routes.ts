// ==============================================================================
// Module: Auth Routes (Fastify)
// TODO (Step 3): Implement Supabase authentication exchange & profile retrieval
// ==============================================================================

import { FastifyPluginAsync } from 'fastify';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', async (_request, reply) => {
    // TODO: Return current authenticated user profile and roles
    return reply.send({ message: 'Auth profile endpoint placeholder' });
  });

  fastify.post('/login', async (_request, reply) => {
    // TODO: Authenticate via Supabase Auth
    return reply.send({ message: 'Login endpoint placeholder' });
  });
};

