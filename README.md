<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7eccf7f2-10d2-4639-b59e-5cd05256b802

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run the test suite

```
npm test
```

Unit tests cover the offline heuristic consistency-checker, all zod request-validation
schemas, and the JSON-file persistence layer (round-trip + corrupt-file recovery).

## Architecture

The backend is organized as small, single-purpose modules rather than one large file:

```
server.ts                        # thin composition root: wires middleware + routers
src/server/
  state.ts                       # single source of truth for the in-memory world state
  persistence.ts                 # atomic, debounced JSON-file storage (data/world-state.json)
  sse.ts                         # Server-Sent Events client registry + broadcast
  gemini.ts                      # Gemini client, retry/model-cascade caller, consistency checker
  validation.ts                  # zod schemas + request-validation middleware
  security.ts                    # secure headers, rate limiting, optional API-key auth
  routes/
    world.routes.ts              # GET /api/world, POST /api/world/seed
    lore.routes.ts                # lore CRUD + AI expansion
    consistency.routes.ts        # audit / demo / resolve / harmonize
    tasks.routes.ts              # task CRUD + AI task suggester
    export.routes.ts             # markdown/JSON world-bible export
    sync.routes.ts               # SSE stream + health check
  __tests__/                     # vitest unit tests
```

## Persistence

World state is persisted to `data/world-state.json` (git-ignored) using atomic
writes (write-to-temp-then-rename) so a crash mid-save can't corrupt the file.
This removes the "everything resets on restart" limitation of a pure in-memory
store, without requiring an external database or credentials to run the app.
Swapping in a real database later only requires changing `persistence.ts` —
every route talks to `state.ts`, never to the filesystem directly.

## Security

- **Input validation**: every mutating route validates its request body against
  a zod schema (`src/server/validation.ts`) before it reaches business logic.
- **Rate limiting**: a general limit protects all `/api` routes, and a stricter
  limit protects the Gemini-backed routes (seeding, expansion, audits, task
  suggestions).
- **Secure headers** via `helmet`.
- **Optional API-key auth**: set `APP_API_KEY` in your environment to require
  `Authorization: Bearer <key>` on every write route. Leave it unset for local
  development/demo use — this keeps the app working out of the box while still
  giving production deployments a real lock.
