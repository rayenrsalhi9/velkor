import type { Request, Response } from "express";
import type { LoginUser } from "../../application/use-cases/LoginUser.js";
import { InvalidCredentialsError } from "../../application/errors/InvalidCredentialsError.js";
import { loginSchema } from "./schemas/loginSchema.js";

export function makeLoginHandler(loginUser: LoginUser) {
  return async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const tokens = await loginUser.execute(
        parsed.data.email,
        parsed.data.password,
      );
      return res.status(200).json(tokens);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
