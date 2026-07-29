import Stripe from "stripe";
import { envVars } from "./env";

if (!envVars.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

export const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);
