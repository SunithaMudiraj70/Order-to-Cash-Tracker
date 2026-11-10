// ==============================================================================
// Plugin: Fastify Sensible Defaults
// ==============================================================================

import sensible from '@fastify/sensible';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const sensiblePluginAsync: FastifyPluginAsync = async (fastify) => {
  await fastify.register(sensible);
};

export const sensiblePlugin = fp(sensiblePluginAsync, {
  name: 'sensible-plugin'
});

