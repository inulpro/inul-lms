"use server";

import Stripe from "stripe";
import { request } from "@arcjet/next";
import { redirect } from "next/navigation";

import { requireUser } from "@/app/data/user/require-user";

import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { ApiResponse } from "@/lib/types";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { getArcjetMode, RATE_LIMITS } from "@/lib/arcjet-config";

const aj = arcjet.withRule(
  fixedWindow({
    mode: getArcjetMode(),
    window: RATE_LIMITS.enrollment.window,
    max: RATE_LIMITS.enrollment.max,
  })
);

export async function enrollInCourseAction(
  courseId: string
): Promise<ApiResponse | never> {
  const sessionUser = await requireUser();

  let checkoutUrl: string;

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: sessionUser.id,
    });

    if (decision.isDenied()) {
      return { status: "error", message: "You have been blocked" };
    }

    // Get course
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        status: "Published",
      },
      select: {
        id: true,
        price: true,
        stripePriceId: true,
      },
    });

    if (!course) {
      return { status: "error", message: "Course not found" };
    }

    // Get user with stripeCustomerId
    const user = await prisma.user.findUnique({
      where: {
        id: sessionUser.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return { status: "error", message: "User not found" };
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          stripeCustomerId: stripeCustomerId,
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          courseId_userId: {
            courseId: courseId,
            userId: user.id,
          },
        },
        select: {
          status: true,
          id: true,
        },
      });

      if (existingEnrollment?.status === "Completed") {
        return {
          status: "success",
          message: "You are already enrolled in this course",
        };
      }

      let enrollment;

      if (existingEnrollment) {
        enrollment = await tx.enrollment.update({
          where: {
            id: existingEnrollment.id,
          },
          data: {
            amount: course.price,
            status: "Pending",
          },
        });
      } else {
        enrollment = await tx.enrollment.create({
          data: {
            courseId: course.id,
            userId: user.id,
            amount: course.price,
            status: "Pending",
          },
        });
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
          {
            price: course.stripePriceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${env.BETTER_AUTH_URL}/payment/success`,
        cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,
        metadata: {
          courseId: course.id,
          userId: user.id,
          enrollmentId: enrollment.id,
        },
      });

      return {
        enrollment: enrollment,
        checkoutUrl: checkoutSession.url,
      };
    });

    checkoutUrl = result.checkoutUrl as string;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      return { status: "error", message: error.message };
    }

    return { status: "error", message: "Failed to enroll in course" };
  }

  redirect(checkoutUrl);
}
