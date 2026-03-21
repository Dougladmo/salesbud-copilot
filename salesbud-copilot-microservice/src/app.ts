import './container.js';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { requestLogger } from './middlewares/request-logger.js';
import { errorHandler } from './middlewares/error-handler.js';
import { apiRouter } from './routes/index.js';
import { clerkWebhookRoutes } from './routes/clerk-webhook.route.js';
import { webhookRoutes } from './routes/webhook.route.js';

const app = express();

// Clerk webhook needs raw body for signature verification — must come BEFORE express.json()
app.use('/clerk-webhook', clerkWebhookRoutes);

// Evolution API webhook — must come BEFORE clerkMiddleware (no auth needed)
app.use(express.json());
app.use('/webhook', webhookRoutes);

app.use(clerkMiddleware());
app.use(requestLogger);
app.use('/', apiRouter);
app.use(errorHandler);

export { app };
