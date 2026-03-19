// biome-ignore lint/style/useImportType: DI token needed at runtime
import { AuthService } from "@auth/application/auth.service";
import type { AuthRequest } from "@auth/domain/types/auth-request.type";
import { ERROR_CODE } from "@common/error-codes";
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  readonly #authService: AuthService;

  constructor(@Inject(AuthService) authService: AuthService) {
    this.#authService = authService;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException({
        code: ERROR_CODE.UNAUTHORIZED,
        message: "No authorization header",
      });
    }

    const token = this.#authService.extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedException({
        code: ERROR_CODE.NO_TOKEN_PROVIDED,
        message: "No token provided",
      });
    }

    try {
      const decodedUser = await this.#authService.verifyToken(token);
      request.user = decodedUser;
      return true;
    } catch {
      throw new UnauthorizedException({
        code: ERROR_CODE.INVALID_TOKEN,
        message: "Invalid token",
      });
    }
  }
}
