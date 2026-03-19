import { AdminGuard } from "@auth/infrastructure/guards/admin.guard.js";
import { FirebaseAuthGuard } from "@auth/infrastructure/guards/firebase-auth.guard.js";
import { StoreOrganiserGuard } from "@auth/infrastructure/guards/store-organiser.guard.js";
import { CurrentUser } from "@common/decorators/current-user.decorator.js";
import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
// biome-ignore lint/style/useImportType: DI token needed at runtime
import { StatsService } from "../application/stats.service.js";

@ApiTags("Stats")
@Controller({ path: "stats", version: "1" })
export class StatsController {
  constructor(
    @Inject(StatsService) private readonly statsService: StatsService
  ) {}

  @ApiOperation({ summary: "Get organiser stats" })
  @Get("organiser")
  @UseGuards(FirebaseAuthGuard, StoreOrganiserGuard)
  getOrganiserStats(@CurrentUser("uid") uid: string) {
    return this.statsService.getOrganiserStats(uid);
  }

  @ApiOperation({ summary: "Get admin stats" })
  @Get("admin")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  getAdminStats() {
    return this.statsService.getAdminStats();
  }
}
