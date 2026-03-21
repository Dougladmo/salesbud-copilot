import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { AppDataSource } from './config/database.js';
import { seedDatabase } from './config/seed.js';
import { connectRabbitMQ, consumeQueue } from './config/rabbitmq.js';
import { handleProcessBuffer } from './subscribers/process-buffer.subscriber.js';
import { container } from './container.js';
import { CalendarService } from './services/calendar.service.js';

const PENDING_RETRY_INTERVAL_MS = 2 * 60_000; // 2 minutes

async function bootstrap() {
  await AppDataSource.initialize();
  logger.info('Database connected');

  await seedDatabase();

  await connectRabbitMQ();
  await consumeQueue(handleProcessBuffer);

  // Periodic retry of failed calendar schedules
  const calendarService = container.resolve(CalendarService);
  setInterval(() => {
    calendarService.retryPendingSchedules().catch((err) => {
      logger.error({ err }, 'Calendar pending retry error');
    });
  }, PENDING_RETRY_INTERVAL_MS);

  app.listen(env.PORT, () => {
    logger.info(`Salesbud SDR Agent running on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start application');
  process.exit(1);
});
