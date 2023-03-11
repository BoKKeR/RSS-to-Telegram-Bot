const env = {
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_PORT: parseInt(process.env.REDIS_PORT),
  REDIS_ENV: process.env.REDIS_ENV,
  ENVIRONMENT: process.env.ENVIRONMENT
};

const queue = {
  messages: "messages"
};

export default { env, queue };
