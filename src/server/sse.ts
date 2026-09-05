import type { Response } from 'express';
import { getWorldState, bumpVersion } from './state.js';

export interface SSEClient {
  id: string;
  res: Response;
  deviceId?: string;
  connectedAt: number;
}

const sseClients: Map<string, SSEClient> = new Map();

export function registerClient(client: SSEClient) {
  sseClients.set(client.id, client);
}

export function removeClient(clientId: string) {
  sseClients.delete(clientId);
}

export function getClientCount(): number {
  return sseClients.size;
}

export function broadcastWorldUpdate(type: string, details?: string, senderDeviceId?: string) {
  bumpVersion();
  const worldState = getWorldState();
  const payload = JSON.stringify({
    type,
    worldState,
    details,
    senderDeviceId,
    clientCount: sseClients.size,
    timestamp: Date.now(),
  });

  for (const [clientId, client] of sseClients.entries()) {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(clientId);
    }
  }
}

/** Keep-alive heartbeat so proxies/load balancers don't kill idle SSE connections. */
export function startHeartbeat(intervalMs = 15000) {
  return setInterval(() => {
    for (const [clientId, client] of sseClients.entries()) {
      try {
        client.res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        sseClients.delete(clientId);
      }
    }
  }, intervalMs);
}
