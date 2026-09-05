import { Router, type Request, type Response } from 'express';
import { getWorldState } from '../state.js';
import { registerClient, removeClient, getClientCount, broadcastWorldUpdate } from '../sse.js';

export const syncRouter = Router();

// SSE Sync Stream Endpoint — real-time multi-device synchronization
syncRouter.get('/sync/stream', (req: Request, res: Response) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;
  const deviceId = (req.query.deviceId as string) || req.headers['x-device-id']?.toString() || 'unknown-device';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  registerClient({ id: clientId, res, deviceId, connectedAt: Date.now() });

  const initialPayload = JSON.stringify({
    type: 'INIT',
    worldState: getWorldState(),
    clientId,
    clientCount: getClientCount(),
    timestamp: Date.now(),
  });
  res.write(`data: ${initialPayload}\n\n`);

  broadcastWorldUpdate('DEVICE_CONNECTED', `Device connected: ${deviceId}`);

  req.on('close', () => {
    removeClient(clientId);
    broadcastWorldUpdate('DEVICE_DISCONNECTED', `Device disconnected: ${deviceId}`);
  });
});

syncRouter.get('/health', (req: Request, res: Response) => {
  const worldState = getWorldState();
  res.json({ status: 'ok', clientCount: getClientCount(), entitiesCount: worldState.entities.length });
});
