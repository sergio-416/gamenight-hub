import type { AuthRequest } from "@auth/domain/types/auth-request.type";
import { ERROR_CODE } from "@common/error-codes";
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    if (request.user?.role === "admin") {
      return true;
    }

    throw new ForbiddenException({
      code: ERROR_CODE.ADMIN_REQUIRED,
      message: "Admin access required",
    });
  }
}
