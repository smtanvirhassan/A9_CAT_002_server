import { createRemoteJWKSet, jwtVerify } from "jose";
import { connectToMongoDB } from "../config/db.js";
import { ObjectId } from "mongodb";

let JWKS = null;

function getJWKS() {
  if (!JWKS) {
    const clientUrl = (process.env.CLIENT_URL || "https://client-one-psi.vercel.app").replace(/\/+$/, "");
    JWKS = createRemoteJWKSet(new URL(`${clientUrl}/api/auth/jwks`));
  }
  return JWKS;
}

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized! No token provided." });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized! Malformed token." });
  }

  try {
    const jwks = getJWKS();
    let payload;
    try {
      const result = await jwtVerify(token, jwks);
      payload = result.payload;
    } catch (jwksErr) {
      return res.status(401).send({ msg: "Unauthorized: Invalid or expired token!" });
    }

    let dbUser = null;
    try {
      const { usersCollection } = await connectToMongoDB();
      if (payload.sub) {
        try {
          dbUser = await usersCollection.findOne({ _id: new ObjectId(payload.sub) });
        } catch (err) {
          dbUser = await usersCollection.findOne({ id: payload.sub });
        }
      }
      if (!dbUser && payload.email) {
        dbUser = await usersCollection.findOne({ email: payload.email });
      }
    } catch (dbErr) {
      console.warn("DB user lookup fallback to JWT payload:", dbErr.message);
    }

    req.user = {
      id: dbUser?._id?.toString() || payload.id || payload.sub,
      email: dbUser?.email || payload.email,
      name: dbUser?.name || payload.name,
      role: dbUser?.role || payload.role || "customer",
      isBlocked: dbUser ? !!dbUser.isBlocked : !!payload.isBlocked,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).send({ msg: "Unauthorized! Verification failed." });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).send({ msg: "Forbidden! Admin access required." });
  }
  next();
};

export const verifyNotBlocked = (req, res, next) => {
  if (req.user && req.user.isBlocked) {
    return res.status(403).send({ msg: "Forbidden! Your account has been blocked." });
  }
  next();
};
