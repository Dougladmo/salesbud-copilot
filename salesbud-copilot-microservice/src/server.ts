import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { AppDataSource } from './config/database.js';
import { seedDatabase } from './config/seed.js';
import { connectRabbitMQ, consumeQueue } from './config/rabbitmq.js';
import { handleProcessBuffer } from './subscribers/process-buffer.subscriber.js';

async function bootstrap() {
  await AppDataSource.initialize();
  logger.info('Database connected');

  await seedDatabase();

  await connectRabbitMQ();
  await consumeQueue(handleProcessBuffer);

  app.listen(env.PORT, () => {
    logger.info(`Salesbud SDR Agent running on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start application');
  process.exit(1);
});
