import Bull from 'bull';
import Redis from 'ioredis';

// PATCH: Accept REDIS_URL or fall back to host/port/password
function buildRedisConnection() {
  const url = process.env.REDIS_URL?.trim();
  if (url) {
    console.log('[Queue] Using REDIS_URL connection string');
    // ioredis accepts a connection string directly
    return new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  // Fallback for environments that still provide parts
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD;

  console.log(`[Queue] Using REDIS_HOST fallback: ${host}:${port}`);

  return new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// Create Redis client for Bull (maintains existing Bull integration)
const createClient = (type: string) => {
  const client = buildRedisConnection();
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
