import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { securityHeaders, apiRateLimiter } from './src/server/security.js';
import { syncRouter } from './src/server/routes/sync.routes.js';
import { worldRouter } from './src/server/routes/world.routes.js';
import { loreRouter } from './src/server/routes/lore.routes.js';
import { consistencyRouter } from './src/server/routes/consistency.routes.js';
import { tasksRouter } from './src/server/routes/tasks.routes.js';
import { exportRouter } from './src/server/routes/export.routes.js';
import { startHeartbeat } from './src/server/sse.js';
import { flushPersistence } from './src/server/state.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ----------------------------------------------------
// GLOBAL MIDDLEWARE
// ----------------------------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(securityHeaders);
app.use('/api', apiRateLimiter);

// ----------------------------------------------------
// API ROUTES
// Each concern (real-time sync, world seeding, lore CRUD, consistency
// checking, task management, exports) lives in its own router module under
// src/server/routes/, instead of one monolithic file. Business logic that
// used to live inline in each handler (Gemini calls, the world-state
// mutation, SSE broadcast) has moved into src/server/{gemini,state,sse}.ts.
// ----------------------------------------------------
app.use('/api', syncRouter);
app.use('/api', worldRouter);
app.use('/api', loreRouter);
app.use('/api', consistencyRouter);
app.use('/api', tasksRouter);
app.use('/api', exportRouter);

startHeartbeat();

// Make sure the very last in-memory mutation isn't lost to the debounce
// window if the process is stopped (Ctrl+C, container shutdown, etc).
process.on('SIGINT', () => {
  flushPersistence();
  process.exit(0);
});
process.on('SIGTERM', () => {
  flushPersistence();
  process.exit(0);
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
