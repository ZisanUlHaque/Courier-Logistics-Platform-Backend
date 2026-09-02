import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL!,
  backend_url: process.env.BACKEND_URL || "http://localhost:5000",
  frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,

  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  google_client_id: process.env.GOOGLE_CLIENT_ID || "",

  admin_name: process.env.ADMIN_NAME!,
  admin_email: process.env.ADMIN_EMAIL!,
  admin_password: process.env.ADMIN_PASSWORD!,

  tester_customer_name: process.env.TESTER_CUSTOMER_NAME!,
  tester_customer_email: process.env.TESTER_CUSTOMER_EMAIL!,
  tester_customer_password: process.env.TESTER_CUSTOMER_PASSWORD!,

  tester_courier_name: process.env.TESTER_COURIER_NAME!,
  tester_courier_email: process.env.TESTER_COURIER_EMAIL!,
  tester_courier_password: process.env.TESTER_COURIER_PASSWORD!,

  redis_user: process.env.REDIS_USER || "",
  redis_password: process.env.REDIS_PASSWORD || "",
  redis_host: process.env.REDIS_HOST || "",
  redis_port: process.env.REDIS_PORT || "",

  smtp_user: process.env.SMTP_USER || "",
  smtp_password: process.env.SMTP_PASSWORD || "",
  email_sender: process.env.EMAIL_SENDER || "",

  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY || "",
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET || "",

  bkash_base_url: process.env.BKASH_BASE_URL || "",
  bkash_username: process.env.BKASH_USERNAME || "",
  bkash_password: process.env.BKASH_PASSWORD || "",
  bkash_app_key: process.env.BKASH_APP_KEY || "",
  bkash_app_secret: process.env.BKASH_APP_SECRET || "",
  bkash_callback_url: process.env.BKASH_CALLBACK_URL || "",
};