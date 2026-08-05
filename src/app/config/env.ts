import dotenv from "dotenv";
dotenv.config();

export const envVars = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "1d",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  NODE_ENV: process.env.NODE_ENV as string,
  PORT: Number(process.env.PORT) || 5000,
  EMAIL_SENDER_SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST as string,
  EMAIL_SENDER_SMTP_PORT: Number(process.env.EMAIL_SENDER_SMTP_PORT),
  EMAIL_SENDER_SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER as string,
  EMAIL_SENDER_SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS as string,
  EMAIL_SENDER_SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM as string,
  HP_TOKEN: process.env.HP_TOKEN as string,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY as string,
  BACKGROUND_REMOVE_API_KEY: process.env.BACKGROUND_REMOVE_API_KEY as string,
  API_LAYER_API_KEY: process.env.API_LAYER_API_KEY as string,
  JSON2_VIDEO_API_KEY: process.env.JSON2_VIDEO_API_KEY as string,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY as string,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
  STRIPE_MONTLY_PRODUCT_ID: process.env.STRIPE_MONTLY_PRODUCT_ID as string,
  STRIPE_YEARLY_PRODUCT_ID: process.env.STRIPE_YEARLY_PRODUCT_ID as string,
  FRONTEND_URL: process.env.FRONTEND_URL as string,

  // admin
  ADMIN_NAME: process.env.ADMIN_NAME as string,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL as string,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD as string,

  // pixazo
  PIXAZO_SUBSCRIPTION_KEY: process.env.PIXAZO_SUBSCRIPTION_KEY as string,

  BACKEND_SERVER_URL: process.env.BACKEND_SERVER_URL as string,

  GROQ_API_KEY: process.env.GROQ_API_KEY as string,
};
