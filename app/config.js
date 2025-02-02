const makeCorsOrigins = () => {
  let origins = [];

  if (process.env.CORS_ORIGINS) {
    origins = process.env.CORS_ORIGINS.split(",");
  }

  return origins;
};

const config = {
  port: process.env.PORT || 3303,
  env: process.env.NODE_ENV || "development",
  // database start ------------
  sqlite: {
    dbPath: process.env.SQLITE_DB_PATH,
  },
  postgres: {
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    dbname: process.env.PG_DB_NAME,
  },
  // database end --------------

  corsOrigins: makeCorsOrigins(),

  // jwt
  accessTokenPrivateKey: process.env.ACCESS_TOKEN_PRIVATE_KEY,
  accessTokenPublicKey: process.env.ACCESS_TOKEN_PUBLIC_KEY,
  refreshTokenPrivateKey: process.env.REFRESH_TOKEN_PRIVATE_KEY,
  refreshTokenPublicKey: process.env.REFRESH_TOKEN_PUBLIC_KEY,

  // email
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUsername: process.env.SMTP_USERNAME,
  smtpPassword: process.env.SMTP_PASSWORD,
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS,

  frontendUrl: process.env.FRONTEND_URL,
};

export default config;
