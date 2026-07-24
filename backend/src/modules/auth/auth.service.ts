import bcrypt from "bcrypt";
import { AppError } from "../../common/errors/app-error.js";
import { generateToken } from "../../common/utils/jwt.js";
import type { AuthRepository } from "./auth.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import type { AuthResponse } from "./auth.types.js";

const BCRYPT_SALT_ROUNDS = 10;
const INVALID_CREDENTIALS = "Invalid email or password";

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const email = this.normalizeEmail(input.email);

    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      throw new AppError("Email already in use", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
    const account = await this.authRepository.createAccountWithUser({
      name: input.name,
      email,
      passwordHash,
    });

    const user = account.users[0];
    if (!user) {
      throw new AppError("Failed to create user", 500);
    }

    return this.buildAuthResponse(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const email = this.normalizeEmail(input.email);

    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new AppError(INVALID_CREDENTIALS, 401);
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError(INVALID_CREDENTIALS, 401);
    }

    return this.buildAuthResponse(user);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private buildAuthResponse(user: {
    id: string;
    accountId: string;
    email: string;
  }): AuthResponse {
    return {
      user: {
        id: user.id,
        accountId: user.accountId,
        email: user.email,
      },
      accessToken: generateToken({
        userId: user.id,
        accountId: user.accountId,
      }),
    };
  }
}
