

import z from "zod";
import type { AuthValidation } from "./auth.validation";


export type TRegisterUser = z.infer<typeof AuthValidation.registerValidationSchema>
export type TLoginUser = z.infer<typeof AuthValidation.loginValidationSchema>
export type TUpdateProfile = z.infer<typeof AuthValidation.updateProfileSchema>
