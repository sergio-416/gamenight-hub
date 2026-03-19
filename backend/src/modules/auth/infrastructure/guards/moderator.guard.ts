import type { AuthRequest } from "@auth/domain/types/auth-request.type";
import { ERROR_CODE } from "@common/error-codes";
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class ModeratorGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const role = request.user?.role;

    if (role === "admin" || role === "moderator") {
      return true;
    }

    throw new ForbiddenException({
      code: ERROR_CODE.MODERATOR_REQUIRED,
      message: "Moderator access required",
    });
  }
}
