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
import { getArcjetMode, RATE_LIMITS } from "./arcjet-config";

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
      mode: getArcjetMode(),
    }),
  ],
});

// Konfigurasi untuk admin actions
export const adminArcjet = arcjet({
  key: env.ARCJET_KEY,
  characteristics: ["fingerprint"],
  rules: [
    shield({
      mode: getArcjetMode(),
    }),
    fixedWindow({
      mode: getArcjetMode(),
      window: RATE_LIMITS.admin.window,
      max: RATE_LIMITS.admin.max,
    }),
  ],
});

// Konfigurasi untuk file upload
export const uploadArcjet = arcjet({
  key: env.ARCJET_KEY,
  characteristics: ["fingerprint"],
  rules: [
    shield({
      mode: getArcjetMode(),
    }),
    fixedWindow({
      mode: getArcjetMode(),
      window: RATE_LIMITS.upload.window,
      max: RATE_LIMITS.upload.max,
    }),
  ],
});
