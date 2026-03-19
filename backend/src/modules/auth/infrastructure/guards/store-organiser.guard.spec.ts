import type { AuthRequest } from "@auth/domain/types/auth-request.type";
import { StoreOrganiserGuard } from "@auth/infrastructure/guards/store-organiser.guard";
import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";

const makeContext = (role: string, userType: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () =>
        ({
          user: { uid: "uid-1", email: "u@e.com", role, userType },
        }) as AuthRequest,
    }),
  }) as unknown as ExecutionContext;

describe("StoreOrganiserGuard", () => {
  let guard: StoreOrganiserGuard;

  beforeEach(() => {
    guard = new StoreOrganiserGuard();
  });

  it("should allow store organisers", async () => {
    await expect(
      guard.canActivate(makeContext("user", "store_organiser"))
    ).resolves.toBe(true);
  });

  it("should allow admins regardless of userType", async () => {
    await expect(
      guard.canActivate(makeContext("admin", "regular"))
    ).resolves.toBe(true);
  });

  it("should throw ForbiddenException for regular users", async () => {
    await expect(
      guard.canActivate(makeContext("user", "regular"))
    ).rejects.toThrow(ForbiddenException);
  });

  it("should throw ForbiddenException for moderators", async () => {
    await expect(
      guard.canActivate(makeContext("moderator", "regular"))
    ).rejects.toThrow(ForbiddenException);
  });
});
