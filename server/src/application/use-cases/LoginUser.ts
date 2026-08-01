import type { UserRepository } from "../ports/UserRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { TokenService } from "../ports/TokenService.js";
import { InvalidCredentialsError } from "../errors/InvalidCredentialsError.js";

export class LoginUser {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenService: TokenService,
  ) {}

  async execute(email: string, password: string) {
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

    return { accessToken, refreshToken };
  }
}
