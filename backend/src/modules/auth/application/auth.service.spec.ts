import { AuthService } from "@auth/application/auth.service";
import { FirebaseAdminProvider } from "@auth/infrastructure/firebase/firebase-admin.provider";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";

const mockVerifyIdToken = vi.fn();
const mockGenerateSignInWithEmailLink = vi.fn();
const mockGetAuth = vi.fn().mockReturnValue({
  verifyIdToken: mockVerifyIdToken,
  generateSignInWithEmailLink: mockGenerateSignInWithEmailLink,
});

const mockFirebaseAdminProvider = {
  getAuth: mockGetAuth,
};

const mockConfigService = {
  get: vi.fn().mockReturnValue("https://gamenight.example.com"),
};

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: FirebaseAdminProvider,
          useValue: mockFirebaseAdminProvider,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe("verifyToken", () => {
    it("should throw UnauthorizedException when no token provided", async () => {
      await expect(service.verifyToken("")).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException for invalid token", async () => {
      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      await expect(service.verifyToken("invalid-token")).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should return user uid and email from valid token", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "firebase-uid-123",
        email: "user@example.com",
      });

      const result = await service.verifyToken("valid-firebase-token");

      expect(result.uid).toBe("firebase-uid-123");
      expect(result.email).toBe("user@example.com");
    });

    it("should return role from custom claims", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "uid-123",
        email: "admin@example.com",
        role: "admin",
      });

      const result = await service.verifyToken("valid-token");

      expect(result.role).toBe("admin");
    });

    it("should return userType from custom claims", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "uid-123",
        email: "organiser@example.com",
        userType: "store_organiser",
      });

      const result = await service.verifyToken("valid-token");

      expect(result.userType).toBe("store_organiser");
    });

    it("should default role to 'user' when claim is absent", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "uid-123",
        email: "user@example.com",
      });

      const result = await service.verifyToken("valid-token");

      expect(result.role).toBe("user");
    });

    it("should default userType to 'regular' when claim is absent", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "uid-123",
        email: "user@example.com",
      });

      const result = await service.verifyToken("valid-token");

      expect(result.userType).toBe("regular");
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract token from Bearer header", () => {
      const result = service.extractTokenFromHeader("Bearer valid-token-123");
      expect(result).toBe("valid-token-123");
    });

    it("should return null for non-Bearer header", () => {
      const result = service.extractTokenFromHeader("Basic valid-token-123");
      expect(result).toBeNull();
    });

    it("should return null when no header provided", () => {
      const result = service.extractTokenFromHeader("");
      expect(result).toBeNull();
    });
  });

  describe("generateMagicLink", () => {
    it("should generate link with correct ActionCodeSettings", async () => {
      mockGenerateSignInWithEmailLink.mockResolvedValue(
        "https://magic.link/token"
      );

      await service.generateMagicLink("user@example.com");

      expect(mockGenerateSignInWithEmailLink).toHaveBeenCalledWith(
        "user@example.com",
        {
          url: "https://gamenight.example.com/auth/callback",
          handleCodeInApp: true,
        }
      );
    });

    it("should return link string on success", async () => {
      mockGenerateSignInWithEmailLink.mockResolvedValue(
        "https://magic.link/token"
      );

      const result = await service.generateMagicLink("user@example.com");

      expect(result).toBe("https://magic.link/token");
    });

    it("should throw on Firebase Admin failure", async () => {
      mockGenerateSignInWithEmailLink.mockRejectedValue(
        new Error("Firebase Admin error")
      );

      await expect(
        service.generateMagicLink("user@example.com")
      ).rejects.toThrow("Firebase Admin error");
    });
  });
});
