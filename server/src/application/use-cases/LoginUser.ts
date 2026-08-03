import type { UserRepository } from "../ports/UserRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { TokenService } from "../ports/TokenService.js";
import type { TokenHasher } from "../ports/TokenHasher.js";
import type { RefreshTokenRepository } from "../ports/RefreshTokenRepository.js";
import { InvalidCredentialsError } from "../errors/InvalidCredentialsError.js";
import type { RefreshResult } from "./RefreshToken.js";

export class LoginUser {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenService: TokenService,
    private refreshTokenRepository: RefreshTokenRepository,
    private tokenHasher: TokenHasher,
  ) {}

  async execute(email: string, password: string): Promise<RefreshResult> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.passwordHasher.hash(password);
      throw new InvalidCredentialsError();
    }

    const isValid = await this.passwordHasher.compare(
      password,
      user.getPasswordHash(),
    );
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const accessToken = this.tokenService.generateAccessToken(user.id);
    const refreshToken = this.tokenService.generateRefreshToken(user.id);
    const refreshTokenExpiresAt = this.tokenService.getRefreshTokenExpiresAt();
    await this.refreshTokenRepository.create(
      this.tokenHasher.hash(refreshToken),
      user.id,
      refreshTokenExpiresAt,
    );

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }
}