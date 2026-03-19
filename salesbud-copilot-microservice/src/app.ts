import './container.js';
import express from 'express';
import { requestLogger } from './middlewares/request-logger.js';
import { errorHandler } from './middlewares/error-handler.js';
import { apiRouter } from './routes/index.js';

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use('/', apiRouter);
app.use(errorHandler);

export { app };
