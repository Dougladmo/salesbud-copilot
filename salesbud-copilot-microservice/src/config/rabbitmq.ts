import amqp, { type ChannelModel, type Channel } from 'amqplib';
import { env } from './env.js';
import { logger } from './logger.js';

const QUEUE = 'sdr_message_queue';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ() {
  connection = await amqp.connect(env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
  logger.info('RabbitMQ connected');
  return channel;
}

export function getChannel() {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
}

export function publishToQueue(data: unknown): void {
  const ch = getChannel();
  ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(data)), { persistent: true });
}

export async function consumeQueue(
  handler: (data: unknown) => Promise<void>,
): Promise<void> {
  const ch = getChannel();
  await ch.consume(
    QUEUE,
    async (msg: any) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        await handler(data);
        ch.ack(msg);
      } catch (err) {
        logger.error({ err }, 'Error processing RMQ message');
        ch.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
  logger.info(`RabbitMQ consumer listening on queue: ${QUEUE}`);
}

export async function closeRabbitMQ(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
}
