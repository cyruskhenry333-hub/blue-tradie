import Bull from 'bull';
import Redis from 'ioredis';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Create Redis client for Bull
const createClient = (type: string) => {
  const client = new Redis(redisConfig);
  client.on('error', (err) => {
    console.error(`[Queue] Redis ${type} error:`, err);
  });
  return client;
};

// Automation queue for delayed execution
export const automationQueue = new Bull('automation', {
  createClient: (type) => createClient(type),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

// Email queue for async email sending
export const emailQueue = new Bull('email', {
  createClient: (type) => createClient(type),
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 50,
    removeOnFail: 200,
  },
});

// Analytics queue for async event processing
export const analyticsQueue = new Bull('analytics', {
  createClient: (type) => createClient(type),
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: 1000,
    removeOnFail: 100,
  },
});

// Queue monitoring
automationQueue.on('completed', (job) => {
  console.log(`[Queue] Automation job ${job.id} completed`);
});

automationQueue.on('failed', (job, err) => {
  console.error(`[Queue] Automation job ${job?.id} failed:`, err.message);
});

emailQueue.on('failed', (job, err) => {
  console.error(`[Queue] Email job ${job?.id} failed:`, err.message);
});

// Graceful shutdown
async function closeQueues() {
  console.log('[Queue] Closing queues...');
  await Promise.all([
    automationQueue.close(),
    emailQueue.close(),
    analyticsQueue.close(),
  ]);
  console.log('[Queue] Queues closed');
}

process.on('SIGTERM', closeQueues);
process.on('SIGINT', closeQueues);

export default {
  automationQueue,
  emailQueue,
  analyticsQueue,
  closeQueues,
};
