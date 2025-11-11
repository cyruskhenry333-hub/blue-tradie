import Bull from 'bull';
import Redis from 'ioredis';

// Redis connection config - prefer REDIS_URL, fallback to HOST/PORT/PASSWORD
const redisConnection = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
    };

// Bull connection options (ioredis handles both string and object)
const bullRedisOptions = {
  redis: typeof redisConnection === 'string'
    ? redisConnection
    : redisConnection,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Log connection method on startup
console.log(`[Queue] Redis connection: ${process.env.REDIS_URL ? 'REDIS_URL' : 'HOST/PORT/PASSWORD'}`);

// Error handler for all Redis connections
const handleRedisError = (err: Error) => {
  console.error('[Queue] Redis connection error:', err.message);
};

// Automation queue for delayed execution
export const automationQueue = new Bull('automation', redisConnection, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
});

// Email queue for async email sending
export const emailQueue = new Bull('email', redisConnection, {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 50,
    removeOnFail: 200,
  },
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
});

// Analytics queue for async event processing
export const analyticsQueue = new Bull('analytics', redisConnection, {
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: 1000,
    removeOnFail: 100,
  },
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
});

// Queue monitoring and error handling
automationQueue.on('completed', (job) => {
  console.log(`[Queue] Automation job ${job.id} completed`);
});

automationQueue.on('failed', (job, err) => {
  console.error(`[Queue] Automation job ${job?.id} failed:`, err.message);
});

automationQueue.on('error', handleRedisError);

emailQueue.on('failed', (job, err) => {
  console.error(`[Queue] Email job ${job?.id} failed:`, err.message);
});

emailQueue.on('error', handleRedisError);

analyticsQueue.on('error', handleRedisError);

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
