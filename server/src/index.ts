import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaUserRepository } from "./infrastructure/database/PrismaUserRepository.js";
import { PrismaRefreshTokenRepository } from "./infrastructure/database/PrismaRefreshTokenRepository.js";
import { BcryptPasswordHasher } from "./infrastructure/security/BcryptPasswordHasher.js";
import { Sha256TokenHasher } from "./infrastructure/security/Sha256TokenHasher.js";
import { JwtTokenService } from "./infrastructure/security/JwtTokenService.js";
import { LoginUser } from "./application/use-cases/LoginUser.js";
import { RefreshToken } from "./application/use-cases/RefreshToken.js";
import { LogoutUser } from "./application/use-cases/LogoutUser.js";
import { GetCurrentUserClaims } from "./application/use-cases/GetCurrentUserClaims.js";
import { GetCurrentUserProfile } from "./application/use-cases/GetCurrentUserProfile.js";
import {
  makeLoginHandler,
  makeRefreshHandler,
  makeLogoutHandler,
  makeMeHandler,
} from "./presentation/http/authHandlers.js";
import { makeAuthenticate } from "./presentation/http/middleware/authenticate.js";
import { makeAttachClaims } from "./presentation/http/middleware/attachClaims.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const userRepository = new PrismaUserRepository(prisma);
const refreshTokenRepository = new PrismaRefreshTokenRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();
const tokenHasher = new Sha256TokenHasher();
const tokenService = new JwtTokenService();
const loginUser = new LoginUser(
  userRepository,
  passwordHasher,
  tokenService,
  refreshTokenRepository,
  tokenHasher,
);
const refreshToken = new RefreshToken(
  refreshTokenRepository,
  tokenService,
  tokenHasher,
);
const logoutUser = new LogoutUser(refreshTokenRepository, tokenHasher);
const getCurrentUserClaims = new GetCurrentUserClaims(userRepository);
const getCurrentUserProfile = new GetCurrentUserProfile(userRepository);

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Velkor server is alive");
});

app.post("/auth/login", makeLoginHandler(loginUser));
app.post("/auth/refresh", makeRefreshHandler(refreshToken));
app.post("/auth/logout", makeLogoutHandler(logoutUser));

app.get(
  "/auth/me",
  makeAuthenticate(tokenService),
  makeAttachClaims(getCurrentUserClaims),
  makeMeHandler(getCurrentUserProfile),
);

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
