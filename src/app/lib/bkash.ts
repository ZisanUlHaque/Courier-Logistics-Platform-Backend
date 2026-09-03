import config from "../config";
import { redisClient } from "./redis";
import httpStatus from "http-status";
import { AppError } from "../utils/AppError";

export const getBkashIdToken = async (): Promise<string> => {
  try {
    const IdTokenKey = "bkash:idToken";
    const RefreshTokenKey = "bkash:refreshToken";

    let bkashIdToken = await redisClient.get(IdTokenKey);
    const bkashIdTokenTTL = await redisClient.ttl(IdTokenKey);

    const bkashRefreshToken = await redisClient.get(RefreshTokenKey);
    const bkashRefreshTokenTTL = await redisClient.ttl(RefreshTokenKey);

    if (
      (bkashIdTokenTTL <= 600 || !bkashIdToken) &&
      bkashRefreshToken &&
      bkashRefreshTokenTTL > 600
    ) {
      const refreshTokenResponse = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: config.bkash_username,
            password: config.bkash_password,
          },
          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: bkashRefreshToken,
          }),
        }
      );

      if (!refreshTokenResponse.ok) {
        throw new AppError(
          httpStatus.BAD_GATEWAY,
          "bKash Refresh Token Grant Failed"
        );
      }

      const bkashRefreshTokenResult = await refreshTokenResponse.json();
      bkashIdToken = bkashRefreshTokenResult.id_token as string;

      await redisClient.set(IdTokenKey, bkashIdToken, {
        EX: 60 * 60,
      });

      return bkashIdToken;
    }

    if (bkashIdToken && bkashIdTokenTTL > 600) {
      return bkashIdToken;
    }

    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: config.bkash_username,
          password: config.bkash_password,
        },
        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
        }),
      }
    );

    if (!response.ok) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "bKash Access Token Grant Failed"
      );
    }

    const result = await response.json();

    await redisClient.set(IdTokenKey, result.id_token, {
      EX: 60 * 60,
    });

    await redisClient.set(RefreshTokenKey, result.refresh_token, {
      EX: 60 * 60 * 24 * 28,
    });

    return result.id_token as string;
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      error instanceof Error ? error.message : "bKash Token request failed"
    );
  }
};

export const createBkashPayment = async (
  amount: number,
  merchantInvoiceNumber: string,
  callbackURL: string
) => {
  const token = await getBkashIdToken();

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-APP-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: "CourierX-Customer",
        callbackURL,
        amount: amount.toFixed(2),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber,
      }),
    }
  );

  const result = await response.json();

  if (result.statusCode !== "0000") {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      `bKash create payment failed: ${result.statusMessage}`
    );
  }

  return result;
};

export const executeBkashPayment = async (paymentID: string) => {
  const token = await getBkashIdToken();

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-APP-Key": config.bkash_app_key,
      },
      body: JSON.stringify({ paymentID }),
    }
  );

  const result = await response.json();

  if (result.statusCode !== "0000") {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      `bKash execute payment failed: ${result.statusMessage}`
    );
  }

  return result;
};

export const queryBkashPayment = async (paymentID: string) => {
  const token = await getBkashIdToken();

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/payment/status`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-APP-Key": config.bkash_app_key,
      },
      body: JSON.stringify({ paymentID }),
    }
  );

  const result = await response.json();

  if (result.statusCode !== "0000") {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      `bKash query payment failed: ${result.statusMessage}`
    );
  }

  return result;
};