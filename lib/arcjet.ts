import "server-only";

import arcjet, {
  detectBot,
  fixedWindow,
  protectSignup,
  sensitiveInfo,
  shield,
  slidingWindow,
} from "@arcjet/next";

import { env } from "./env";

export {
  detectBot,
  fixedWindow,
  protectSignup,
  sensitiveInfo,
  shield,
  slidingWindow,
};

// Base Arcjet instance dengan konfigurasi umum
export default arcjet({
  key: env.ARCJET_KEY,
  characteristics: ["fingerprint"],
  rules: [
    shield({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
    }),
  ],
});

// Konfigurasi untuk admin actions
export const adminArcjet = arcjet({
  key: env.ARCJET_KEY,
  characteristics: ["fingerprint"],
  rules: [
    shield({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
    }),
    fixedWindow({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
      window: "1m",
      max: 10, // Lebih longgar untuk admin
    }),
  ],
});

// Konfigurasi untuk file upload
export const uploadArcjet = arcjet({
  key: env.ARCJET_KEY,
  characteristics: ["fingerprint"],
  rules: [
    shield({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
    }),
    fixedWindow({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
      window: "5m",
      max: 3, // Lebih ketat untuk upload
    }),
  ],
});
