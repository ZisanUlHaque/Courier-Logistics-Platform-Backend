import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import type { SignOptions } from "jsonwebtoken";
import path from "path";
import type { TokenPayload } from "google-auth-library";
import config from "../../config";
import { googleClient } from "../../lib/googleAuth";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import type {
  IForgotPasswordPayload,
  IGoogleLoginPayload,
  ILoginUserPayload,
  IRegisterPayload,
  IRequestUser,
  IResetPasswordPayload,
  IVerifyEmailPayload,
} from "./auth.interface";
import {
  AuthProvider,
  UserRole,
  UserStatus,
} from "../../../generated/prisma/enums";

const registerUser = async (payload: IRegisterPayload) => {
  const { name, password } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists",
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const expirationSeconds = 5 * 60;

  const otpKey = `registration-otp:${email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(otpKey, otpValue, {
    expiration: { type: "EX", value: expirationSeconds },
  });

  const registrationKey = `registration-data:${email}`;
  const redisUserData = {
    name,
    email,
    password: hashedPassword,
    phone: payload.phone || null,
    role: payload.role || "CUSTOMER",
  };

  await redisClient.set(registrationKey, JSON.stringify(redisUserData), {
    expiration: { type: "EX", value: expirationSeconds },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/registration-otp.ejs",
  );
  const html = await ejs.renderFile(templatePath, {
    name,
    otp: otpValue,
    expirationMinutes: expirationSeconds / 60,
  });

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "CourierX — Verify Your Email",
    html,
  });
};

const verifyEmail = async (payload: IVerifyEmailPayload) => {
  const { otp } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExist = await prisma.user.findUnique({ where: { email } });

  if (isUserExist?.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
  }
  if (isUserExist?.emailVerified) {
    throw new AppError(httpStatus.CONFLICT, "Email already verified");
  }
  if (isUserExist?.deletedAt) {
    throw new AppError(httpStatus.GONE, "User is deleted");
  }

  const otpKey = `registration-otp:${email}`;
  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }
  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
  }

  await redisClient.del(otpKey);

  const registrationKey = `registration-data:${email}`;
  const redisUserData = await redisClient.get(registrationKey);

  if (!redisUserData) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Registration data expired. Register again.",
    );
  }

  const userData =
    typeof redisUserData === "string"
      ? JSON.parse(redisUserData)
      : redisUserData;

  const createdUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      role: userData.role as UserRole,
      status: UserStatus.ACTIVE,
      authProvider: AuthProvider.CREDENTIAL,
      emailVerified: true,
      ...(userData.role === "COURIER" && {
        courierProfile: {
          create: { vehicleType: "MOTORCYCLE", availabilityStatus: "OFFLINE" },
        },
      }),
    },
    omit: { password: true },
    include: { courierProfile: userData.role === "COURIER" },
  });

  await redisClient.del(registrationKey);

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/welcome-email.ejs",
  );
  const html = await ejs.renderFile(templatePath, {
    name: createdUser.name,
    frontendUrl: config.frontend_url,
  });

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Welcome to CourierX Logistics! 🚚",
    html,
  });

  const jwtPayload = {
    userId: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    role: createdUser.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return { user: createdUser, accessToken, refreshToken };
};

const loginUser = async (payload: ILoginUserPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
  if (user.status === UserStatus.SUSPENDED)
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
  if (user.deletedAt) throw new AppError(httpStatus.GONE, "User is deleted");
  if (!user.emailVerified)
    throw new AppError(httpStatus.FORBIDDEN, "Email not verified");
  if (user.password === null && user.googleId !== null) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Account registered with Google. Login with Google.",
    );
  }

  const isMatch = await bcrypt.compare(password, user.password as string);
  if (!isMatch)
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return { accessToken, refreshToken };
};

const getMe = async (user: IRequestUser) => {
  const result = await prisma.user.findUnique({
    where: { id: user.userId },
    include: { courierProfile: true },
    omit: { password: true },
  });
  if (!result) throw new AppError(httpStatus.NOT_FOUND, "User not found");
  return result;
};

const refreshToken = async (token: string) => {
  const verified = jwtUtils.verifyToken(token, config.jwt_refresh_secret);
  if (!verified.success || !verified.data) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      config.node_env === "development"
        ? verified.error
        : "Invalid refresh token",
    );
  }

  const payload = verified.data;
  if (
    typeof payload === "string" ||
    typeof payload !== "object" ||
    !("userId" in payload) ||
    typeof payload.userId !== "string"
  ) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User inactive or not found");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );
  const newRefreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return { accessToken, refreshToken: newRefreshToken };
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
  let googlePayload: TokenPayload | null | undefined = null;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });
    googlePayload = ticket.getPayload();
  } catch {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired Google ID token",
    );
  }

  if (!googlePayload?.email || !googlePayload?.name) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid Google token data");
  }

  let user = await prisma.user.findUnique({
    where: { email: googlePayload.email },
  });

  if (user) {
    if (user.status === UserStatus.SUSPENDED)
      throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
    if (user.deletedAt) throw new AppError(httpStatus.GONE, "User is deleted");
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googlePayload.sub,
          authProvider: AuthProvider.GOOGLE,
        },
      });
    }
  } else {
    user = await prisma.user.create({
      data: {
        name: googlePayload.name,
        email: googlePayload.email,
        role: UserRole.CUSTOMER,
        googleId: googlePayload.sub,
        authProvider: AuthProvider.GOOGLE,
        emailVerified: true,
        status: UserStatus.ACTIVE,
      },
    });

    const templatePath = path.join(
      process.cwd(),
      "src/app/templates/welcome-email.ejs",
    );
    const html = await ejs.renderFile(templatePath, {
      name: user.name,
      frontendUrl: config.frontend_url,
    });
    await transporter.sendMail({
      from: config.email_sender,
      to: user.email,
      subject: "Welcome to CourierX! 🚚",
      html,
    });
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );
  const newRefreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return { accessToken, refreshToken: newRefreshToken };
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const { email } = payload;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
  if (user.status === UserStatus.SUSPENDED)
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
  if (!user.emailVerified)
    throw new AppError(httpStatus.FORBIDDEN, "Email not verified");
  if (user.deletedAt) throw new AppError(httpStatus.GONE, "User is deleted");
  if (user.googleId && user.authProvider === AuthProvider.GOOGLE) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Google account — cannot reset password",
    );
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const key = `forgot-password-otp:${email}`;
  const expirationSeconds = 5 * 60;

  await redisClient.set(key, otp, {
    expiration: { type: "EX", value: expirationSeconds },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/forgot-password.ejs",
  );
  const html = await ejs.renderFile(templatePath, {
    name: user.name,
    otp,
    expirationMinutes: expirationSeconds / 60,
  });

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "CourierX — Password Reset OTP",
    html,
  });
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
  if (user.status === UserStatus.SUSPENDED)
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
  if (!user.emailVerified)
    throw new AppError(httpStatus.FORBIDDEN, "Email not verified");
  if (user.deletedAt) throw new AppError(httpStatus.GONE, "User is deleted");
  if (user.googleId && user.authProvider === AuthProvider.GOOGLE) {
    throw new AppError(httpStatus.CONFLICT, "Google account");
  }

  const key = `forgot-password-otp:${email}`;
  const redisOtp = await redisClient.get(key);

  if (!redisOtp)
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  if (redisOtp !== otp)
    throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");

  const hashed = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );
  await prisma.user.update({ where: { email }, data: { password: hashed } });
  await redisClient.del(key);

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/reset-password-success.ejs",
  );
  const html = await ejs.renderFile(templatePath, { name: user.name });
  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "CourierX — Password Changed",
    html,
  });
};

export const AuthService = {
  registerUser,
  verifyEmail,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
  forgotPassword,
  resetPassword,
};
