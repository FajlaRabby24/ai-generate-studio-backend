import { jwtVerify, SignJWT } from "jose";

const getAccessToken = async (payload: any) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES_IN as string)
    .sign(secret);
};

const getRefreshToken = async (payload: any) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN as string)
    .sign(secret);
};

const verifyToken = async (token: string) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
  const { payload } = await jwtVerify(token, secret);
  return payload;
};

export const tokenUtils = {
  getAccessToken,
  getRefreshToken,
  verifyToken,
};
