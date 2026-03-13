// Initialize the Rampnow API client with the correct baseUrl from environment variables

import { client } from '@/snippets/client/client.gen';

export function initializeRampnowClient() {
  const apiUrl = process.env.APP_API_URL || 'http://localhost:3000';
  client.setConfig({ baseUrl: apiUrl });
}
