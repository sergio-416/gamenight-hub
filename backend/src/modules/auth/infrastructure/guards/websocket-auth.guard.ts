// biome-ignore lint/style/useImportType: DI token needed at runtime
import { AuthService } from "@auth/application/auth.service";
import { ERROR_CODE } from "@common/error-codes";
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Socket } from "socket.io";

@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  readonly #authService: AuthService;

  constructor(@Inject(AuthService) authService: AuthService) {
    this.#authService = authService;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = client.handshake.auth?.token as string | undefined;

    if (!token) {
      throw new UnauthorizedException({
        code: ERROR_CODE.NO_TOKEN_PROVIDED,
        message: "No token provided",
      });
    }

    try {
      await this.#authService.verifyToken(token);
      return true;
    } catch {
      throw new UnauthorizedException({
        code: ERROR_CODE.INVALID_TOKEN,
        message: "Invalid token",
      });
    }
  }
}
