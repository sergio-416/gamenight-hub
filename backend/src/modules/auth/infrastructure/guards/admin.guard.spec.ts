import type { AuthRequest } from "@auth/domain/types/auth-request.type";
import { AdminGuard } from "@auth/infrastructure/guards/admin.guard";
import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";

const makeContext = (role: string, userType = "regular"): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () =>
        ({
          user: { uid: "uid-1", email: "u@e.com", role, userType },
        }) as AuthRequest,
    }),
  }) as unknown as ExecutionContext;

describe("AdminGuard", () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  it("should allow admin users", async () => {
    await expect(guard.canActivate(makeContext("admin"))).resolves.toBe(true);
  });

  it("should throw ForbiddenException for moderator users", async () => {
    await expect(guard.canActivate(makeContext("moderator"))).rejects.toThrow(
      ForbiddenException
    );
  });

  it("should throw ForbiddenException for regular users", async () => {
    await expect(guard.canActivate(makeContext("user"))).rejects.toThrow(
      ForbiddenException
    );
  });

  it("should throw ForbiddenException for store organisers", async () => {
    await expect(
      guard.canActivate(makeContext("user", "store_organiser"))
    ).rejects.toThrow(ForbiddenException);
  });
});
