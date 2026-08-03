export interface IRequestUser {
  id: string;
  role: Role;
  email: string;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user: IRequestUser;
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
