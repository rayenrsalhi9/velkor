import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaUserRepository } from "./infrastructure/database/PrismaUserRepository.js";
import { PrismaRoleRepository } from "./infrastructure/database/PrismaRoleRepository.js";
import { PrismaRefreshTokenRepository } from "./infrastructure/database/PrismaRefreshTokenRepository.js";
import { BcryptPasswordHasher } from "./infrastructure/security/BcryptPasswordHasher.js";
import { Sha256TokenHasher } from "./infrastructure/security/Sha256TokenHasher.js";
import { JwtTokenService } from "./infrastructure/security/JwtTokenService.js";
import { LoginUser } from "./application/use-cases/LoginUser.js";
import { RefreshToken } from "./application/use-cases/RefreshToken.js";
import { LogoutUser } from "./application/use-cases/LogoutUser.js";
import { GetCurrentUser } from "./application/use-cases/GetCurrentUser.js";
import { UpdateCurrentUserProfile } from "./application/use-cases/UpdateCurrentUserProfile.js";
import { CreateRole } from "./application/use-cases/CreateRole.js";
import { UpdateRole } from "./application/use-cases/UpdateRole.js";
import { DeleteRole } from "./application/use-cases/DeleteRole.js";
import { ListUsers } from "./application/use-cases/ListUsers.js";
import { CreateUser } from "./application/use-cases/CreateUser.js";
import { UpdateUser } from "./application/use-cases/UpdateUser.js";
import { DeleteUser } from "./application/use-cases/DeleteUser.js";
import {
  makeLoginHandler,
  makeRefreshHandler,
  makeLogoutHandler,
  makeUpdateMeHandler,
} from "./presentation/http/authHandlers.js";
import {
  listClaimsHandler,
  makeListRolesHandler,
  makeCreateRoleHandler,
  makeUpdateRoleHandler,
  makeDeleteRoleHandler,
} from "./presentation/http/roleHandlers.js";
import {
  makeListUsersHandler,
  makeCreateUserHandler,
  makeUpdateUserHandler,
  makeDeleteUserHandler,
} from "./presentation/http/userHandlers.js";
import { makeAuthenticate } from "./presentation/http/middleware/authenticate.js";
import { makeAttachCurrentUser } from "./presentation/http/middleware/attachCurrentUser.js";
import { makeRequireClaim } from "./presentation/http/middleware/requireClaim.js";

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
const getCurrentUser = new GetCurrentUser(userRepository);
const roleRepository = new PrismaRoleRepository(prisma);
const createRole = new CreateRole(roleRepository);
const updateRole = new UpdateRole(roleRepository);
const deleteRole = new DeleteRole(roleRepository);
const listUsers = new ListUsers(userRepository);
const createUser = new CreateUser(
  userRepository,
  passwordHasher,
  roleRepository,
);
const updateUser = new UpdateUser(
  userRepository,
  passwordHasher,
  roleRepository,
);
const deleteUser = new DeleteUser(userRepository);
const updateCurrentUserProfile = new UpdateCurrentUserProfile(
  userRepository,
  passwordHasher,
);

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
  makeAttachCurrentUser(getCurrentUser),
  (req, res) => res.json(req.currentUser!),
);

const requireRolesManage = makeRequireClaim("roles:manage");

app.get(
  "/claims",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireRolesManage,
  listClaimsHandler,
);
app.get(
  "/roles",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireRolesManage,
  makeListRolesHandler(roleRepository),
);
app.post(
  "/roles",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireRolesManage,
  makeCreateRoleHandler(createRole),
);
app.patch(
  "/roles/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireRolesManage,
  makeUpdateRoleHandler(updateRole),
);
app.delete(
  "/roles/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireRolesManage,
  makeDeleteRoleHandler(deleteRole),
);

const requireUsersManage = makeRequireClaim("users:manage");

app.get(
  "/users",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireUsersManage,
  makeListUsersHandler(listUsers),
);
app.post(
  "/users",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireUsersManage,
  makeCreateUserHandler(createUser),
);
app.patch(
  "/users/me",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  makeUpdateMeHandler(updateCurrentUserProfile),
);
app.patch(
  "/users/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireUsersManage,
  makeUpdateUserHandler(updateUser),
);
app.delete(
  "/users/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireUsersManage,
  makeDeleteUserHandler(deleteUser),
);

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
