import { auth } from "../../lib/auth";
import type { TRegisterUser } from "./auth.type";

const registerUser = async (payload: TRegisterUser) => {
  const { name, email, password, image } = payload;

  const result = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
      image,
    },
  });


  return {
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    image: result.user.image,

  };
};

export const AuthService = {
  registerUser,
};
