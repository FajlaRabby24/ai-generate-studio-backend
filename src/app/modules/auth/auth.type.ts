// export type TRegisterUser = {
//   name: string;
//   email: string;
//   password: string;
//   image?: string;
// };

import z from "zod";
import type { AuthValidation } from "./auth.validation";


export type TRegisterUser = z.infer<typeof AuthValidation.registerValidationSchema>
