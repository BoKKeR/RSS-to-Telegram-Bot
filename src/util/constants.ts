const env = {
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_PORT: parseInt(process.env.REDIS_PORT),
  REDIS_ENV: process.env.REDIS_ENV,
  REDIS_USER: process.env.REDIS_USER,
  REDIS_MUTEX: process.env.REDIS_MUTEX
};

const queue = {
  messages: `messages_${env.REDIS_MUTEX}`
};

export default { env, queue };
