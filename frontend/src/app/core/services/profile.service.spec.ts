import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_CONFIG } from "@core/config/api.config";
import type { Profile } from "@gamenight-hub/shared";
import { ProfileService } from "./profile.service";

const makeProfile = (overrides = {}): Profile => ({
	uid: "user-uid-123",
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
	showFirstName: false,
	showLastName: false,
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
	...overrides,
});

describe("ProfileService", () => {
	let service: ProfileService;
	let httpMock: HttpTestingController;
	const baseUrl = API_CONFIG.baseUrl;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				ProfileService,
				provideHttpClient(),
				provideHttpClientTesting(),
			],
		});

		service = TestBed.inject(ProfileService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	describe("getMyProfile", () => {
		it("should GET own profile from backend", () => {
			const profile = makeProfile();
			service.getMyProfile().subscribe((result) => {
				expect(result.uid).toBe("user-uid-123");
			});

			const req = httpMock.expectOne(`${baseUrl}/profile/me`);
			expect(req.request.method).toBe("GET");
			req.flush(profile);
		});
	});

	describe("updateMyProfile", () => {
		it("should PATCH profile and return updated profile", () => {
			const updated = makeProfile({ bio: "Board game fanatic" });
			service
				.updateMyProfile({ bio: "Board game fanatic" })
				.subscribe((result) => {
					expect(result.bio).toBe("Board game fanatic");
				});

			const req = httpMock.expectOne(`${baseUrl}/profile/me`);
			expect(req.request.method).toBe("PATCH");
			expect(req.request.body).toEqual({ bio: "Board game fanatic" });
			req.flush(updated);
		});
	});
});
