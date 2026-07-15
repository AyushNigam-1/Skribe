import { Request, Response, NextFunction } from "express";
import { auth } from "../utils/auth";
import { fromNodeHeaders } from "better-auth/node";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name?: string;
        email?: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers) as Headers,
    });

    if (session?.user) {
      req.user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      };
    }
  } catch (error) {
    console.error("⚠️ Better Auth Session Check Failed:", error);
  }

  if (req.path === "/graphql") {
    const operationName = req.body?.operationName;
    const query = req.body?.query || "";

    const allowedOperations = [
      "Register",
      "Login",
      "IntrospectionQuery",
    ];

    const isIntrospection =
      query.includes("__schema") || query.includes("__type");

    const isAllowed =
      (operationName && allowedOperations.includes(operationName)) ||
      isIntrospection;

    if (!req.user && !isAllowed) {
      return res.status(401).json({
        errors: [
          {
            message: "Unauthorized: Session expired or missing",
            extensions: { code: "UNAUTHENTICATED" },
          },
        ],
      });
    }
  }

  next();
};