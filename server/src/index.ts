import "dotenv/config";
import express from "express";
import http from "node:http";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { makeTokenBucketRateLimit } from "./presentation/http/middleware/tokenBucketRateLimit.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaUserRepository } from "./infrastructure/database/PrismaUserRepository.js";
import { PrismaRoleRepository } from "./infrastructure/database/PrismaRoleRepository.js";
import { PrismaCategoryRepository } from "./infrastructure/database/PrismaCategoryRepository.js";
import { PrismaChatRepository } from "./infrastructure/database/PrismaChatRepository.js";
import { PrismaNotificationRepository } from "./infrastructure/database/PrismaNotificationRepository.js";
import { PrismaDocumentRepository } from "./infrastructure/database/PrismaDocumentRepository.js";
import { PrismaSurveyRepository } from "./infrastructure/database/PrismaSurveyRepository.js";
import { PrismaSurveyResponseRepository } from "./infrastructure/database/PrismaSurveyResponseRepository.js";
import { LocalDiskFileStorage } from "./infrastructure/storage/LocalDiskFileStorage.js";
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
import { ListRoles } from "./application/use-cases/ListRoles.js";
import { ListUsers } from "./application/use-cases/ListUsers.js";
import { CreateCategory } from "./application/use-cases/CreateCategory.js";
import { UpdateCategory } from "./application/use-cases/UpdateCategory.js";
import { DeleteCategory } from "./application/use-cases/DeleteCategory.js";
import { ListCategories } from "./application/use-cases/ListCategories.js";
import { ListDocuments } from "./application/use-cases/ListDocuments.js";
import { UploadDocument } from "./application/use-cases/UploadDocument.js";
import { DownloadDocument } from "./application/use-cases/DownloadDocument.js";
import { SoftDeleteDocument } from "./application/use-cases/SoftDeleteDocument.js";
import { UpdateDocument } from "./application/use-cases/UpdateDocument.js";
import { CreateSurvey } from "./application/use-cases/CreateSurvey.js";
import { ListSurveys } from "./application/use-cases/ListSurveys.js";
import { ListPendingSurveys } from "./application/use-cases/ListPendingSurveys.js";
import { GetSurveyAnalytics } from "./application/use-cases/GetSurveyAnalytics.js";
import { SubmitSurveyResponse } from "./application/use-cases/SubmitSurveyResponse.js";
import { CloseSurvey } from "./application/use-cases/CloseSurvey.js";
import { SoftDeleteSurvey } from "./application/use-cases/SoftDeleteSurvey.js";
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
import {
  makeListCategoriesHandler,
  makeCreateCategoryHandler,
  makeUpdateCategoryHandler,
  makeDeleteCategoryHandler,
} from "./presentation/http/categoryHandlers.js";
import {
  makeListDocumentsHandler,
  makeUploadDocumentHandler,
  makeDownloadDocumentHandler,
  makeSoftDeleteDocumentHandler,
  makeUpdateDocumentHandler,
} from "./presentation/http/documentHandlers.js";
import {
  makeCreateSurveyHandler,
  makeListSurveysHandler,
  makeListPendingSurveysHandler,
  makeGetSurveyAnalyticsHandler,
  makeSubmitSurveyResponseHandler,
  makeCloseSurveyHandler,
  makeDeleteSurveyHandler,
} from "./presentation/http/surveyHandlers.js";
import {
  makeDeleteChannelHandler,
  makeListChannelsHandler,
  makeCreateChannelHandler,
  makeListMessagesHandler,
  makeSoftDeleteMessageHandler,
} from "./presentation/http/chatHandlers.js";
import {
  makeListNotificationsHandler,
  makeReadNotificationsHandler,
} from "./presentation/http/notificationHandlers.js";
import { ListChannels } from "./application/use-cases/ListChannels.js";
import { CreateChannel } from "./application/use-cases/CreateChannel.js";
import { DeleteChannel } from "./application/use-cases/DeleteChannel.js";
import { ListMessages } from "./application/use-cases/ListMessages.js";
import { SendMessage } from "./application/use-cases/SendMessage.js";
import { SoftDeleteMessage } from "./application/use-cases/SoftDeleteMessage.js";
import { ListNotifications } from "./application/use-cases/ListNotifications.js";
import { MarkNotificationsRead } from "./application/use-cases/MarkNotificationsRead.js";
import { attachChatWebSocket } from "./presentation/ws/chatWebSocketServer.js";
import { makeAuthenticate } from "./presentation/http/middleware/authenticate.js";
import { makeAttachCurrentUser } from "./presentation/http/middleware/attachCurrentUser.js";
import {
  makeRequireClaim,
  makeRequireAnyClaim,
} from "./presentation/http/middleware/requireClaim.js";

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
const notificationRepository = new PrismaNotificationRepository(prisma);
const createRole = new CreateRole(roleRepository);
const updateRole = new UpdateRole(roleRepository, notificationRepository);
const deleteRole = new DeleteRole(roleRepository);
const listRoles = new ListRoles(roleRepository);
const listUsers = new ListUsers(userRepository);
const createUser = new CreateUser(
  userRepository,
  passwordHasher,
  roleRepository,
  notificationRepository,
);
const updateUser = new UpdateUser(
  userRepository,
  passwordHasher,
  roleRepository,
  refreshTokenRepository,
  notificationRepository,
);
const deleteUser = new DeleteUser(userRepository);
const categoryRepository = new PrismaCategoryRepository(prisma);
const createCategory = new CreateCategory(categoryRepository);
const updateCategory = new UpdateCategory(categoryRepository);
const deleteCategory = new DeleteCategory(categoryRepository);
const listCategories = new ListCategories(categoryRepository);
const documentRepository = new PrismaDocumentRepository(prisma);
const listDocuments = new ListDocuments(documentRepository);
const fileStorage = new LocalDiskFileStorage("uploads");
const uploadDocument = new UploadDocument(
  documentRepository,
  categoryRepository,
  roleRepository,
  fileStorage,
  notificationRepository,
);
const downloadDocument = new DownloadDocument(documentRepository, fileStorage);
const softDeleteDocument = new SoftDeleteDocument(
  documentRepository,
  fileStorage,
);
const updateDocument = new UpdateDocument(
  documentRepository,
  categoryRepository,
  roleRepository,
  notificationRepository,
);
const updateCurrentUserProfile = new UpdateCurrentUserProfile(
  userRepository,
  passwordHasher,
  refreshTokenRepository,
);

const surveyRepository = new PrismaSurveyRepository(prisma);
const surveyResponseRepository = new PrismaSurveyResponseRepository(prisma);
const createSurvey = new CreateSurvey(surveyRepository, roleRepository);
const listSurveys = new ListSurveys(surveyRepository);
const listPendingSurveys = new ListPendingSurveys(surveyRepository);
const getSurveyAnalytics = new GetSurveyAnalytics(
  surveyRepository,
  surveyResponseRepository,
);
const submitSurveyResponse = new SubmitSurveyResponse(
  surveyRepository,
  surveyResponseRepository,
);
const closeSurvey = new CloseSurvey(surveyRepository);
const softDeleteSurvey = new SoftDeleteSurvey(surveyRepository);

const chatRepository = new PrismaChatRepository(prisma);
const listChannels = new ListChannels(chatRepository);
const createChannel = new CreateChannel(chatRepository);
const deleteChannel = new DeleteChannel(chatRepository);
const listMessages = new ListMessages(chatRepository);
const sendMessage = new SendMessage(chatRepository);
const softDeleteMessage = new SoftDeleteMessage(chatRepository);
const listNotifications = new ListNotifications(notificationRepository);
const markNotificationsRead = new MarkNotificationsRead(notificationRepository);

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

const authLimiter = makeTokenBucketRateLimit({
  capacity: 5,
  refillRate: 0.5,
});

app.post("/api/auth/login", authLimiter, makeLoginHandler(loginUser));
app.post("/api/auth/refresh", authLimiter, makeRefreshHandler(refreshToken));
app.post("/api/auth/logout", authLimiter, makeLogoutHandler(logoutUser));

app.get(
  "/api/auth/me",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  (req, res) => res.json(req.currentUser!),
);

const requireRolesManage = makeRequireClaim("roles:manage");

app.get(
  "/api/claims",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireRolesManage,
  listClaimsHandler,
);
app.get(
  "/api/roles",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireRolesManage,
  makeListRolesHandler(listRoles),
);
app.post(
  "/api/roles",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireRolesManage,
  makeCreateRoleHandler(createRole),
);
app.patch(
  "/api/roles/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireRolesManage,
  makeUpdateRoleHandler(updateRole),
);
app.delete(
  "/api/roles/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireRolesManage,
  makeDeleteRoleHandler(deleteRole),
);

const requireUsersManage = makeRequireClaim("users:manage");
const requireCategoriesView = makeRequireClaim("documents:view-categories");
const requireCategoriesManage = makeRequireClaim("categories:manage");

app.get(
  "/api/users",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireUsersManage,
  makeListUsersHandler(listUsers),
);
app.post(
  "/api/users",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireUsersManage,
  makeCreateUserHandler(createUser),
);
app.patch(
  "/api/users/me",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  makeUpdateMeHandler(updateCurrentUserProfile),
);
app.patch(
  "/api/users/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireUsersManage,
  makeUpdateUserHandler(updateUser),
);
app.delete(
  "/api/users/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireUsersManage,
  makeDeleteUserHandler(deleteUser),
);

app.get(
  "/api/categories",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireCategoriesView,
  makeListCategoriesHandler(listCategories),
);
app.post(
  "/api/categories",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireCategoriesManage,
  makeCreateCategoryHandler(createCategory),
);
app.patch(
  "/api/categories/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireCategoriesManage,
  makeUpdateCategoryHandler(updateCategory),
);
app.delete(
  "/api/categories/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireCategoriesManage,
  makeDeleteCategoryHandler(deleteCategory),
);

const requireDocumentsView = makeRequireClaim("documents:view-list");
const requireDocumentsAssignedView = makeRequireClaim(
  "documents:view-assigned",
);
const requireDocumentsAnyView = makeRequireAnyClaim([
  "documents:view-list",
  "documents:view-assigned",
]);
const requireDocumentsUpload = makeRequireClaim("documents:upload");
const requireDocumentsEdit = makeRequireClaim("documents:edit");
const requireDocumentsDelete = makeRequireClaim("documents:delete");

app.get(
  "/api/documents",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  (req, res, next) => {
    const require =
      req.query.scope === "assigned"
        ? requireDocumentsAssignedView
        : requireDocumentsView;
    require(req, res, next);
  },
  makeListDocumentsHandler(listDocuments, roleRepository),
);
app.post(
  "/api/documents",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireDocumentsUpload,
  makeUploadDocumentHandler(uploadDocument),
);
app.get(
  "/api/documents/:id/download",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireDocumentsAnyView,
  makeDownloadDocumentHandler(downloadDocument, roleRepository),
);
app.patch(
  "/api/documents/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireDocumentsEdit,
  makeUpdateDocumentHandler(updateDocument),
);
app.delete(
  "/api/documents/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireDocumentsDelete,
  makeSoftDeleteDocumentHandler(softDeleteDocument),
);

const requireSurveysView = makeRequireClaim("surveys:view");
const requireSurveysCreate = makeRequireClaim("surveys:create");

app.get(
  "/api/surveys",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireSurveysView,
  makeListSurveysHandler(listSurveys, roleRepository),
);
app.post(
  "/api/surveys",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireSurveysCreate,
  makeCreateSurveyHandler(createSurvey),
);
app.get(
  "/api/surveys/pending",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  makeListPendingSurveysHandler(listPendingSurveys, roleRepository),
);
app.get(
  "/api/surveys/:id/analytics",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireSurveysView,
  makeGetSurveyAnalyticsHandler(getSurveyAnalytics),
);
app.post(
  "/api/surveys/:id/respond",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  makeSubmitSurveyResponseHandler(submitSurveyResponse, roleRepository),
);
app.patch(
  "/api/surveys/:id/close",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireSurveysView,
  makeCloseSurveyHandler(closeSurvey),
);
app.delete(
  "/api/surveys/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireSurveysView,
  makeDeleteSurveyHandler(softDeleteSurvey),
);

const requireChatUse = makeRequireClaim("chat:use");

app.get(
  "/api/notifications",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  makeListNotificationsHandler(listNotifications),
);
app.post(
  "/api/notifications/read",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  makeReadNotificationsHandler(markNotificationsRead),
);

app.get(
  "/api/channels",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireChatUse,
  makeListChannelsHandler(listChannels),
);
app.post(
  "/api/channels",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireChatUse,
  makeCreateChannelHandler(createChannel),
);
app.delete(
  "/api/channels/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireChatUse,
  makeDeleteChannelHandler(deleteChannel),
);
app.get(
  "/api/channels/:id/messages",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireChatUse,
  makeListMessagesHandler(listMessages),
);
app.delete(
  "/api/messages/:id",
  makeAuthenticate(tokenService),
  makeAttachCurrentUser(getCurrentUser),
  requireChatUse,
  makeSoftDeleteMessageHandler(softDeleteMessage, {
    onDeleted: (messageId) => chatSocket.broadcastMessageDeleted(messageId),
  }),
);

const server = http.createServer(app);
const chatSocket = attachChatWebSocket({
  server,
  tokenService,
  getCurrentUser,
  sendMessage,
});

const PORT = Number(process.env.PORT ?? 3000);
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
