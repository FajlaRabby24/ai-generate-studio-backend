import { UserRole } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

const seedAdmin = async () => {
  try {
    const isExists = await prisma.user.findFirst({
      where: {
        email: envVars.ADMIN_EMAIL,
        role: UserRole.ADMIN,
      },
    });

    if (isExists) {
      console.log("admin already exists");
      return;
    }

    const name = envVars.ADMIN_NAME;
    const email = envVars.ADMIN_EMAIL;
    const password = envVars.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "NAME, EMAIL, and PASSWORD environment variables are required for seeding super admin",
      );
    }

    const adminData = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        role: UserRole.ADMIN,
      },
    });

    console.log("admin created successfully", adminData);
  } catch (error) {
    console.log(error);
  }
};

seedAdmin();
