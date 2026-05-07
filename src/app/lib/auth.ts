import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { prisma } from "./prisma";
// If your Prisma file is located elsewhere, you can change the path

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  emailVerification: {
    sendOnSignIn: false,
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      emailVerified: {
        type: "boolean",
        required: true,
        defaultValue: true,
      },
      phone: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.USER,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE,
      },
      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
      },
    }
  }
});
