import { FirebaseAuthGuard } from "@auth/infrastructure/guards/firebase-auth.guard.js";
import { NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { GamesService } from "../../games/application/games.service.js";
import { XpService } from "../../xp/application/xp.service.js";
import { ProfileService } from "../application/profile.service.js";
import { ProfileController } from "./profile.controller.js";

const MOCK_UID = "user-uid-123";
const MOCK_EMAIL = "user@example.com";

const makeProfile = (overrides = {}) => ({
  uid: MOCK_UID,
  firstName: null,
  lastName: null,
  username: "john_doe",
  email: null,
  backupEmail: null,
  mobilePhone: null,
  avatar: null,
  bio: null,
  location: null,
  postalZip: null,
  birthday: null,
  isProfilePublic: false,
  useRealNameForContact: false,
  showFirstName: true,
  showLastName: true,
  showLocation: false,
  showPostalZip: false,
  showBirthday: false,
  showMobilePhone: false,
  showBackupEmail: false,
  showEmail: false,
  showGameCollection: true,
  nameChangedAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  deletedAt: null,
  ...overrides,
});

describe("ProfileController", () => {
  let controller: ProfileController;

  const mockProfileService = {
    getMyProfile: vi.fn(),
    updateMyProfile: vi.fn(),
    getPublicProfile: vi.fn(),
    deleteMyProfile: vi.fn(),
    getDeletionEligibility: vi.fn(),
  };

  const mockGamesService = {
    findAll: vi.fn(),
  };

  const mockXpService = {
    getProfile: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        { provide: ProfileService, useValue: mockProfileService },
        { provide: GamesService, useValue: mockGamesService },
        { provide: XpService, useValue: mockXpService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  describe("GET /profile/me", () => {
    it("should return the authenticated user's own profile", async () => {
      const profile = makeProfile();
      mockProfileService.getMyProfile.mockResolvedValue(profile);

      const result = await controller.getMyProfile(MOCK_UID, MOCK_EMAIL);

      expect(result.uid).toBe(MOCK_UID);
      expect(mockProfileService.getMyProfile).toHaveBeenCalledWith(
        MOCK_UID,
        MOCK_EMAIL
      );
    });

    it("should throw NotFoundException when profile has been soft-deleted", async () => {
      mockProfileService.getMyProfile.mockRejectedValue(
        new NotFoundException({
          code: "PROFILE_NOT_FOUND",
          message: "This account has been deleted",
        })
      );

      await expect(
        controller.getMyProfile(MOCK_UID, MOCK_EMAIL)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("PATCH /profile/me", () => {
    it("should update and return the profile with provided fields", async () => {
      const updated = makeProfile({
        bio: "Board game fanatic",
        location: "Barcelona",
      });
      mockProfileService.updateMyProfile.mockResolvedValue(updated);

      const result = await controller.updateMyProfile(MOCK_UID, {
        bio: "Board game fanatic",
        location: "Barcelona",
      });

      expect(result.bio).toBe("Board game fanatic");
      expect(result.location).toBe("Barcelona");
      expect(mockProfileService.updateMyProfile).toHaveBeenCalledWith(
        MOCK_UID,
        {
          bio: "Board game fanatic",
          location: "Barcelona",
        }
      );
    });
  });

  describe("GET /profile/:username", () => {
    it("should return sanitised public profile when username exists and profile is public", async () => {
      const publicProfile = makeProfile({
        isProfilePublic: true,
        email: "secret@example.com",
        showEmail: false,
      });
      mockProfileService.getPublicProfile.mockResolvedValue(publicProfile);

      const result = await controller.getPublicProfile("john_doe");

      expect(result.username).toBe("john_doe");
      expect(result.isProfilePublic).toBe(true);
      expect(result.email).toBeNull();
      expect(result).not.toHaveProperty("uid");
      expect(result).not.toHaveProperty("postalZip");
      expect(mockProfileService.getPublicProfile).toHaveBeenCalledWith(
        "john_doe"
      );
    });
  });

  describe("GET /profile/:username/games", () => {
    it("should return paginated games when profile is public and collection is visible", async () => {
      const profile = makeProfile({
        isProfilePublic: true,
        showGameCollection: true,
      });
      const gamesResponse = {
        data: [{ id: "g1", name: "Catan" }],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };
      mockProfileService.getPublicProfile.mockResolvedValue(profile);
      mockGamesService.findAll.mockResolvedValue(gamesResponse);

      const result = await controller.getPublicGames("john_doe", 1, 50);

      expect(result.data).toHaveLength(1);
      expect(mockGamesService.findAll).toHaveBeenCalledWith(MOCK_UID, {
        page: 1,
        limit: 50,
      });
    });

    it("should throw NotFoundException when collection is hidden", async () => {
      const profile = makeProfile({
        isProfilePublic: true,
        showGameCollection: false,
      });
      mockProfileService.getPublicProfile.mockResolvedValue(profile);

      await expect(
        controller.getPublicGames("john_doe", 1, 50)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("GET /profile/:username/xp", () => {
    it("should return XP profile when it exists", async () => {
      const profile = makeProfile({ isProfilePublic: true });
      const xpProfile = {
        userId: MOCK_UID,
        xpTotal: 500,
        level: 3,
        streakWeeks: 2,
        lastActivityAt: new Date(),
        levelTitle: "Apprentice Archivist",
        nextLevelXp: 2000,
        xpToNextLevel: 1500,
        progressPercent: 20,
      };
      mockProfileService.getPublicProfile.mockResolvedValue(profile);
      mockXpService.getProfile.mockResolvedValue(xpProfile);

      const result = await controller.getPublicXp("john_doe");

      expect(result.level).toBe(3);
      expect(result.xpTotal).toBe(500);
    });

    it("should return defaults when no XP profile exists", async () => {
      const profile = makeProfile({ isProfilePublic: true });
      mockProfileService.getPublicProfile.mockResolvedValue(profile);
      mockXpService.getProfile.mockResolvedValue(null);

      const result = await controller.getPublicXp("john_doe");

      expect(result.level).toBe(1);
      expect(result.levelTitle).toBe("Wandering Pawn");
      expect(result.xpTotal).toBe(0);
      expect(result.progressPercent).toBe(0);
    });
  });

  describe("DELETE /profile", () => {
    it("should return 200 with success response when authenticated", async () => {
      mockProfileService.deleteMyProfile.mockResolvedValue({
        success: true,
        message: "Account deleted successfully",
      });

      const result = await controller.deleteMyProfile(MOCK_UID);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Account deleted successfully");
    });

    it("should call service with correct uid from token", async () => {
      mockProfileService.deleteMyProfile.mockResolvedValue({
        success: true,
        message: "Account deleted successfully",
      });

      await controller.deleteMyProfile(MOCK_UID);

      expect(mockProfileService.deleteMyProfile).toHaveBeenCalledWith(MOCK_UID);
    });
  });
});
