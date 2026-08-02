import type { UserRole } from "../../generated/prisma/enums";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: UserRole;
        email: string;
        sessionId: string;
      };
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      currentGenerationField?: string;
    }
  }
}
