const { Queue } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

async function clear() {
  const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
  const matchingQueue = new Queue('matching', { connection });

  console.log('Clearing the matching queue to stop AI matching processes...');
  
  // Pause the queue first
  await matchingQueue.pause();
  
  // Clean all types of jobs from the queue
  await matchingQueue.drain(true); // true means pause and delete all waiting/delayed jobs
  await matchingQueue.clean(0, 100000, 'wait');
  await matchingQueue.clean(0, 100000, 'active');
  await matchingQueue.clean(0, 100000, 'delayed');
  await matchingQueue.clean(0, 100000, 'failed');
  
  // Obliterate completely wipes all data associated with the queue
  try {
      await matchingQueue.obliterate({ force: true });
  } catch (err) {
      console.log('Obliterate skipped or failed:', err.message);
  }

  console.log('Queue completely cleared!');
  await connection.quit();
}

clear().catch(console.error);
