// Initialize the Rampnow API client with the correct baseUrl from environment variables

import { client } from '@/snippets/client/client.gen';

/**
 * https://app.dev.rampnow.io for development, https://app.rampnow.io for production
 * localhost:3000 for local development
 */
export function initializeRampnowClient() {
  const apiUrl = process.env.APP_API_URL || 'https://app.dev.rampnow.io';
  client.setConfig({ baseUrl: apiUrl });
}
