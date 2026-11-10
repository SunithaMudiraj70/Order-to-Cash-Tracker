// ==============================================================================
// Plugin: Supabase Connection & Scope
// ==============================================================================

import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { supabaseAdmin } from '../db/client.js';

const supabasePluginAsync: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('supabase', supabaseAdmin);
};

export const supabasePlugin = fp(supabasePluginAsync, {
  name: 'supabase-plugin'
});

declare module 'fastify' {
  interface FastifyInstance {
    supabase: typeof supabaseAdmin;
  }
}

