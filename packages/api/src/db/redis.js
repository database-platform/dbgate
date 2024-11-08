const Redis = require('ioredis');
const { getLogger } = require('dbgate-tools');

const logger = getLogger('reids');

logger.info(`REDIS_TYPE: ${process.env.REDIS_TYPE}`);
function getConfig() {
  let options;
  if (process.env.REDIS_TYPE === 'single') {
    options = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: process.env.REDIS_DB || 0,
    };
  } else if (process.env.REDIS_TYPE === 'sentinel') {
    let sentinels;
    try {
      logger.info(`REDIS_SENTINELS: ${process.env.REDIS_SENTINELS}`);
      if (process.env.REDIS_SENTINELS) {
        sentinels = JSON.parse(process.env.REDIS_SENTINELS);
      }
    } catch (error) {
      logger.error('Check redis config.');
    }
    options = {
      sentinels,
      name: process.env.REDIS_NAME || 'mymaster',
      password: process.env.REDIS_PASSWORD || '',
      db: process.env.REDIS_DB || 0,
    };
  }
  return options;
}
let redisClient;
function init() {
  if (!redisClient) {
    const options = getConfig();
    if (options) {
      redisClient = new Redis(options);
      redisClient.on('connect', () => {
        logger.info('Redis connected.');
      });
      redisClient.on('error', err => {
        logger.error(`Redis connect error: ${err.message}`);
      });
    } else {
      logger.info('Redis no config.');
    }
  }
}

init();

module.exports = redisClient;
