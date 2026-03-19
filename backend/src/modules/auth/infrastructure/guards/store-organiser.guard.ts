import type { AuthRequest } from "@auth/domain/types/auth-request.type";
import { ERROR_CODE } from "@common/error-codes";
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class StoreOrganiserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const { role, userType } = request.user ?? {};

    if (role === "admin" || userType === "store_organiser") {
      return true;
    }

    throw new ForbiddenException({
      code: ERROR_CODE.STORE_ORGANISER_REQUIRED,
      message: "Store organiser access required",
    });
  }
}
