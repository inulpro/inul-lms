import { ArcjetDecision } from "@arcjet/next";

import { ApiResponse } from "./types";

/**
 * Handle Arcjet decision dan return response yang sesuai
 */
export function handleArcjetDecision(
  decision: ArcjetDecision
): ApiResponse | null {
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
      };
    }

    if (decision.reason.isBot()) {
      return {
        status: "error",
        message: "Akses ditolak: Bot terdeteksi.",
      };
    }

    if (decision.reason.isEmail()) {
      return {
        status: "error",
        message: "Email tidak valid atau tidak diizinkan.",
      };
    }

    if (decision.reason.isShield()) {
      return {
        status: "error",
        message: "Permintaan ditolak karena alasan keamanan.",
      };
    }

    return {
      status: "error",
      message: "Permintaan ditolak.",
    };
  }

  return null; // Tidak ada error
}

/**
 * Log Arcjet decision untuk debugging
 */
export function logArcjetDecision(decision: ArcjetDecision, context?: string) {
  const prefix = context ? `[${context}]` : "[Arcjet]";

  if (decision.isDenied()) {
    console.warn(`${prefix} Request denied:`, {
      reason: decision.reason,
      ruleResults: decision.results,
    });
  } else if (process.env.NODE_ENV === "development") {
    console.log(`${prefix} Request allowed:`, {
      ruleResults: decision.results,
    });
  }
}
