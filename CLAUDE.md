# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SalesBud Copilot is an AI-powered SDR (Sales Development Representative) agent that automates WhatsApp conversations for sales teams. It consists of two services: a backend microservice and a React admin frontend.

## Monorepo Structure

- **`salesbud-copilot-microservice/`** — Express 5 + TypeScript backend (Node ESM)
- **`frontend/`** — React 19 + Vite + TypeScript SPA for managing companies, sellers, and documents

## Commands

### Backend (`salesbud-copilot-microservice/`)
```bash
npm run dev          # Start with tsx watch (hot reload)
npm run build        # TypeScript compile
npm start            # Run compiled dist/server.js
npm test             # vitest run
npm run test:watch   # vitest (watch mode)
npm run test:cov     # vitest with coverage
npm run lint         # eslint src/
```

### Frontend (`frontend/`)
```bash
npm run dev          # Vite dev server on :5173 (proxies /companies, /sellers to :3000)
npm run build        # tsc -b && vite build
npm run lint         # eslint .
```

### Infrastructure (from `salesbud-copilot-microservice/`)
```bash
docker compose up -d   # PostgreSQL 17, Redis 7, RabbitMQ 4 (with management UI on :15672)
```

## Architecture

### Backend — Message Processing Pipeline

1. **WhatsApp webhook** receives messages at `/webhook`
2. **MessageBufferService** accumulates messages in Redis per seller+contact with a configurable timeout (default 5s)
3. On timeout, a job is published to **RabbitMQ** queue
4. **process-buffer subscriber** consumes the queue: flushes buffer → calls AgentService → sends response back via WhatsApp
5. Response routing: URLs → media message, long text (> `audioThreshold`) with `voiceId` → TTS audio via ElevenLabs, otherwise → text with typing delay

### Backend — AI Agent

- Uses **LangGraph** (`createReactAgent`) with GPT-4o
- Tools: `rag-search` (Pinecone vector search across company + seller namespaces) and `think` (reflection tool)
- Conversation memory stored in **Redis** lists, trimmed to `maxMemoryMessages` per seller config
- System prompt built dynamically from seller personality traits (formality, humor, communication style, empathy, selling approach)

### Backend — Key Patterns

- **DI**: `tsyringe` with `@injectable()` decorators, singletons registered in `container.ts`
- **ORM**: TypeORM with `synchronize: true` (auto-schema sync, no migrations)
- **Validation**: Zod schemas in `src/validations/`, applied via `validate` middleware
- **Error handling**: `AppError` class + `catchAsync` wrapper + centralized `errorHandler` middleware
- **Env config**: Zod-validated in `src/config/env.ts`
- **Logging**: Pino

### Data Model

- **Company** → has many **Sellers** → has many **Leads**
- Company holds a Pinecone namespace for company-wide knowledge
- Seller has personality trait enums, an optional Pinecone namespace for seller-specific knowledge, voice config, timing settings, and a dynamic Evolution API instance (auto-created)
- Evolution API credentials are global (env vars `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`), instances are per-seller

### Frontend

- React Router v7 with layout wrapper
- Pages: Companies, Sellers, Documents (CRUD management)
- API client in `src/api/client.ts` using native `fetch`
- Vite proxies `/companies` and `/sellers` to backend at `localhost:3000`

## Environment Variables (Backend)

Required: `DATABASE_URL`, `OPENROUTER_API_KEY`, `PINECONE_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`
Optional with defaults: `PORT` (3000), `REDIS_URL`, `RABBITMQ_URL`, `PINECONE_INDEX` (salesbud-sdr), `ELEVENLABS_API_KEY`, `WEBHOOK_BASE_URL`

See `.env.example` in the microservice directory.

## Conventions

- ESM throughout (`"type": "module"`), imports use `.js` extensions in backend
- Backend follows controller → service → model layered architecture
- Route files export a Router, aggregated in `src/routes/index.ts`
- All entity IDs are UUIDs (validated by `uuidParam` middleware)
