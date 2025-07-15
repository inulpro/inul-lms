import "server-only";

/**
 * Konfigurasi Arcjet yang dioptimalkan untuk development dan production
 */

// Mode configuration berdasarkan environment
export const getArcjetMode = () => {
  return process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN";
};

// Timeout configuration
export const ARCJET_TIMEOUTS = {
  default: 5000, // 5 detik untuk operasi umum
  upload: 10000, // 10 detik untuk upload
  auth: 3000, // 3 detik untuk auth (lebih cepat)
} as const;

// Rate limiting configuration yang dioptimalkan
export const RATE_LIMITS = {
  auth: {
    window: "5m",
    max: 15,
  },
  admin: {
    window: "2m",
    max: 15,
  },
  upload: {
    window: "10m",
    max: 5,
  },
  enrollment: {
    window: "5m",
    max: 5,
  },
} as const;

// Bot detection configuration
export const BOT_CONFIG = {
  allowedCategories: [
    "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
    "CATEGORY:MONITOR", // Uptime monitoring services
    "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
    "STRIPE_WEBHOOK", // Stripe webhook
  ] as const,
};

// Email validation configuration
export const EMAIL_CONFIG = {
  blockedTypes: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"] as const,
};

// Development mode helpers
export const isDevelopment = () => process.env.NODE_ENV === "development";
export const isProduction = () => process.env.NODE_ENV === "production";

// Logging configuration
export const shouldLogArcjetDecisions = () => {
  return isDevelopment() || process.env.ARCJET_DEBUG === "true";
};
