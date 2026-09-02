import { TRACKING_PREFIX } from "../constants";

export const generateTrackingNumber = (): string => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `${TRACKING_PREFIX}-${year}-${timestamp}${random}`;
};
