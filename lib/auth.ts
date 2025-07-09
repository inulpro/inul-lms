import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "./env";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      clientId: env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        // Runtime checks for environment variables
        if (
          !process.env.EMAIL_SERVER_HOST ||
          !process.env.EMAIL_SERVER_USER ||
          !process.env.EMAIL_SERVER_PASSWORD
        ) {
          throw new Error(
            "Missing required email server environment variables"
          );
        }
        // Create a transporter using Gmail SMTP with Google app password
        const transportOptions: SMTPTransport.Options = {
          host: process.env.EMAIL_SERVER_HOST,
          port: parseInt(process.env.EMAIL_SERVER_PORT || "465"),
          secure: true, // Always use SSL/TLS for port 465
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
          // Timeout settings
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000,
        };

        const transporter = nodemailer.createTransport(transportOptions);

        // Email message options
        const mailOptions = {
          from: process.env.EMAIL_SERVER_USER,
          to: email,
          subject: "inuLMS - Verify your email",
          html: `<p>Your OTP is <strong>${otp}</strong></p>`,
        };

        // Send the email
        try {
          await transporter.sendMail(mailOptions);
          console.log("OTP email sent to", email);
          // Removed return true to match expected Promise<void> return type
        } catch (error) {
          console.error("Error sending OTP email:", error);
          throw new Error("Failed to send OTP email");
        }
      },
    }),
  ],
});
