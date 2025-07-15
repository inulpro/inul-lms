import ip from "@arcjet/ip";
import { NextRequest } from "next/server";
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
 * Get client IP address dengan fallback yang lebih baik
 */
export function getClientIP(request: NextRequest): string {
  // Coba dapatkan IP dari berbagai header
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  // Gunakan Arcjet IP utility sebagai fallback
  const arcjetIP = ip(request);

  // Prioritas: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > Arcjet IP > localhost
  const clientIP =
    cfConnectingIP ||
    realIP ||
    forwardedFor?.split(",")[0]?.trim() ||
    arcjetIP ||
    "127.0.0.1";

  // Log hanya di development untuk debugging
  if (process.env.NODE_ENV === "development" && clientIP === "127.0.0.1") {
    console.log("[Arcjet] Using localhost IP in development mode");
  }

  return clientIP;
}

/**
 * Wrapper untuk Arcjet protect dengan error handling yang robust
 */
export async function protectWithErrorHandling<
  T extends Record<string, unknown>
>(
  arcjetInstance: {
    protect: (
      request: NextRequest | Request,
      options: T
    ) => Promise<ArcjetDecision>;
  },
  request: NextRequest | Request,
  options: T,
  context?: string
): Promise<{ decision?: ArcjetDecision; error?: string }> {
  try {
    const decision = await arcjetInstance.protect(request, options);
    logArcjetDecision(decision, context);
    return { decision };
  } catch (error: unknown) {
    const prefix = context ? `[${context}]` : "[Arcjet]";

    // Type guard untuk error object
    const isErrorWithNameAndCode = (
      err: unknown
    ): err is { name: string; code: number; message: string } => {
      return (
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        "code" in err &&
        "message" in err
      );
    };

    if (isErrorWithNameAndCode(error)) {
      if (error.name === "TimeoutError" || error.code === 23) {
        console.warn(
          `${prefix} Timeout error - allowing request to proceed:`,
          error.message
        );
        return { error: "timeout" };
      }

      if (error.name === "NetworkError" || error.code === 19) {
        console.warn(
          `${prefix} Network error - allowing request to proceed:`,
          error.message
        );
        return { error: "network" };
      }
    }

    console.error(
      `${prefix} Unexpected error - allowing request to proceed:`,
      error
    );
    return { error: "unknown" };
  }
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
