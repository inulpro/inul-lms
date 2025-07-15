import Stripe from "stripe";
import { headers } from "next/headers";

import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const courseId = session.metadata?.courseId;
      const enrollmentId = session.metadata?.enrollmentId;
      const userId = session.metadata?.userId;
      const customerId = session.customer as string;

      if (!courseId || !enrollmentId || !userId) {
        return new Response("Missing required metadata", { status: 400 });
      }

      // Verify user exists and matches customer
      const user = await prisma.user.findUnique({
        where: {
          stripeCustomerId: customerId,
        },
        select: {
          id: true,
          stripeCustomerId: true,
        },
      });

      if (!user || user.id !== userId) {
        return new Response("User verification failed", { status: 400 });
      }

      // Update enrollment status
      await prisma.enrollment.update({
        where: {
          id: enrollmentId,
        },
        data: {
          status: "Completed",
        },
      });
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
}
