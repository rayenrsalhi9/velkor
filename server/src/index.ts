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
import { GetCurrentUserClaims } from "./application/use-cases/GetCurrentUserClaims.js";
import { GetCurrentUserProfile } from "./application/use-cases/GetCurrentUserProfile.js";
import { UpdateCurrentUserProfile } from "./application/use-cases/UpdateCurrentUserProfile.js";
import { ListRoles } from "./application/use-cases/ListRoles.js";
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
  makeMeHandler,
  makeUpdateMeHandler,
} from "./presentation/http/authHandlers.js";
import {
  makeListClaimsHandler,
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
import { makeAttachClaims } from "./presentation/http/middleware/attachClaims.js";
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
const getCurrentUserClaims = new GetCurrentUserClaims(userRepository);
const getCurrentUserProfile = new GetCurrentUserProfile(userRepository);
const roleRepository = new PrismaRoleRepository(prisma);
const listRoles = new ListRoles(roleRepository);
const createRole = new CreateRole(roleRepository);
const updateRole = new UpdateRole(roleRepository);
const deleteRole = new DeleteRole(roleRepository);
const listUsers = new ListUsers(userRepository);
const createUser = new CreateUser(userRepository, passwordHasher, roleRepository);
const updateUser = new UpdateUser(userRepository, passwordHasher, roleRepository);
const deleteUser = new DeleteUser(userRepository);
const updateCurrentUserProfile = new UpdateCurrentUserProfile(
  userRepository,
  passwordHasher,
  refreshTokenRepository,
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
  makeAttachClaims(getCurrentUserClaims),
  makeMeHandler(getCurrentUserProfile),
);

const requireRolesManage = makeRequireClaim("roles:manage");

app.get(
  "/claims",
  makeAuthenticate(tokenService),
  makeAttachClaims(getCurrentUserClaims),
  requireRolesManage,
  makeListClaimsHandler(),
);
app.get(
  "/roles",
  makeAuthenticate(tokenService),
  makeAttachClaims(getCurrentUserClaims),
  requireRolesManage,
  makeListRolesHandler(listRoles),
);
app.post(
  "/roles",
  makeAuthenticate(tokenService),
  makeAttachClaims(getCurrentUserClaims),
  requireRolesManage,
  makeCreateRoleHandler(createRole),
);
app.patch(
  "/roles/:id",
  makeAuthenticate(tokenService),
  makeAttachClaims(getCurrentUserClaims),
  requireRolesManage,
  makeUpdateRoleHandler(updateRole),
);
app.delete(
  "/roles/:id",
  makeAuthenticate(tokenService),
  makeAttachClaims(getCurrentUserClaims),
  requireRolesManage,
  makeDeleteRoleHandler(deleteRole),
);

const requireUsersManage = makeRequireClaim("users:manage");

app.get(
  "/users",
  makeAuthenticate(tokenService),
  makeAttachClaims(getCurrentUserClaims),
  requireUsersManage,
  makeListUsersHandler(listUsers),
);
app.post(
  "/users",
  makeAuthenticate(tokenService),
  makeAttachClaims(getCurrentUserClaims),
  requireUsersManage,
  makeCreateUserHandler(createUser),
);
app.patch(
  "/users/me",
  makeAuthenticate(tokenService),
  makeAttachClaims(getCurrentUserClaims),
  makeUpdateMeHandler(updateCurrentUserProfile),
);
app.patch(
  "/users/:id",
  makeAuthenticate(tokenService),
  makeAttachClaims(getCurrentUserClaims),
  requireUsersManage,
  makeUpdateUserHandler(updateUser),
);
app.delete(
  "/users/:id",
  makeAuthenticate(tokenService),
  makeAttachClaims(getCurrentUserClaims),
  requireUsersManage,
  makeDeleteUserHandler(deleteUser),
);

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
