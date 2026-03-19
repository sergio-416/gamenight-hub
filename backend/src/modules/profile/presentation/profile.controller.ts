import { FirebaseAuthGuard } from "@auth/infrastructure/guards/firebase-auth.guard.js";
import { CurrentUser } from "@common/decorators/current-user.decorator.js";
import { ZodValidationPipe } from "@common/pipes/zod-validation.pipe.js";
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ERROR_CODE } from "@common/error-codes";
// biome-ignore lint/style/useImportType: DI token needed at runtime
import { ProfileService } from "../application/profile.service.js";
// biome-ignore lint/style/useImportType: DI token needed at runtime
import { GamesService } from "../../games/application/games.service.js";
// biome-ignore lint/style/useImportType: DI token needed at runtime
import { XpService } from "../../xp/application/xp.service.js";
import { toPublicProfile } from "../application/profile.sanitiser.js";
import type { UpdateProfileDto } from "./dto/update-profile.dto.js";
import { UpdateProfileSchema } from "./dto/update-profile.dto.js";

@ApiTags("Profile")
@Controller({ path: "profile", version: "1" })
export class ProfileController {
  constructor(
    @Inject(ProfileService) private readonly profileService: ProfileService,
    @Inject(GamesService) private readonly gamesService: GamesService,
    @Inject(XpService) private readonly xpService: XpService
  ) {}

  @ApiOperation({ summary: "Get own profile" })
  @Get("me")
  @UseGuards(FirebaseAuthGuard)
  getMyProfile(
    @CurrentUser("uid") uid: string,
    @CurrentUser("email") email: string
  ) {
    return this.profileService.getMyProfile(uid, email);
  }

  @ApiOperation({ summary: "Update own profile" })
  @Patch("me")
  @UseGuards(FirebaseAuthGuard)
  updateMyProfile(
    @CurrentUser("uid") uid: string,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto
  ) {
    return this.profileService.updateMyProfile(uid, dto);
  }

  @ApiOperation({ summary: "Check if the account can be deleted" })
  @Get("me/deletion-eligibility")
  @UseGuards(FirebaseAuthGuard)
  getDeletionEligibility(@CurrentUser("uid") uid: string) {
    return this.profileService.getDeletionEligibility(uid);
  }

  @ApiOperation({ summary: "Get public game collection by username" })
  @Get(":username/games")
  async getPublicGames(
    @Param("username") username: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number
  ) {
    const profile = await this.profileService.getPublicProfile(username);

    if (!profile.showGameCollection) {
      throw new NotFoundException({
        code: ERROR_CODE.PROFILE_NOT_FOUND,
        message: "Game collection is not public",
      });
    }

    return this.gamesService.findAll(profile.uid, { page, limit });
  }

  @ApiOperation({ summary: "Get public XP profile by username" })
  @Get(":username/xp")
  async getPublicXp(@Param("username") username: string) {
    const profile = await this.profileService.getPublicProfile(username);
    const xpProfile = await this.xpService.getProfile(profile.uid);

    if (!xpProfile) {
      return {
        level: 1,
        levelTitle: "Wandering Pawn",
        xpTotal: 0,
        nextLevelXp: 250,
        progressPercent: 0,
        streakWeeks: 0,
      };
    }

    return xpProfile;
  }

  @ApiOperation({ summary: "Get public profile by username" })
  @Get(":username")
  async getPublicProfile(@Param("username") username: string) {
    const profile = await this.profileService.getPublicProfile(username);
    return toPublicProfile(profile);
  }

  @ApiOperation({ summary: "Delete own profile (soft delete)" })
  @Delete()
  @UseGuards(FirebaseAuthGuard)
  deleteMyProfile(@CurrentUser("uid") uid: string) {
    return this.profileService.deleteMyProfile(uid);
  }
}
