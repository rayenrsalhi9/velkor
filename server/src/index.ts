import "dotenv/config";
import express from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaUserRepository } from "./infrastructure/database/PrismaUserRepository.js";
import { BcryptPasswordHasher } from "./infrastructure/security/BcryptPasswordHasher.js";
import { JwtTokenService } from "./infrastructure/security/JwtTokenService.js";
import { LoginUser } from "./application/use-cases/LoginUser.js";
import { makeLoginHandler } from "./presentation/http/authHandlers.js";

const userRepository = new PrismaUserRepository(
  new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) }),
);
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const loginUser = new LoginUser(userRepository, passwordHasher, tokenService);

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Velkor server is alive");
});

app.post("/auth/login", makeLoginHandler(loginUser));

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
