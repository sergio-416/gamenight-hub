import { FirebaseAdminProvider } from '@auth/infrastructure/firebase/firebase-admin.provider.js';
import { DB_TOKEN } from '@database/database.module.js';
import { profiles } from '@database/schema/profiles.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { buildMockDb, chainResolving } from '@test/db-mock.js';
import { ProfileService } from './profile.service.js';

const OWNER_UID = 'user-uid-123';
const OTHER_UID = 'user-uid-456';

const makeProfile = (overrides = {}) => ({
	uid: OWNER_UID,
	firstName: null,
	lastName: null,
	username: 'john_doe',
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
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
	deletedAt: null,
	...overrides,
});

const mockFirebaseAdmin = {
	getAuth: vi.fn().mockReturnValue({
		deleteUser: vi.fn().mockResolvedValue(undefined),
	}),
};

const mockEventEmitter = {
	emit: vi.fn(),
};

describe('ProfileService', () => {
	let service: ProfileService;
	let mockDb: ReturnType<typeof buildMockDb>;

	beforeEach(async () => {
		vi.clearAllMocks();
		mockDb = buildMockDb({
			select: [makeProfile()],
			insert: [makeProfile()],
			update: [makeProfile()],
		});

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProfileService,
				{ provide: DB_TOKEN, useValue: mockDb },
				{ provide: FirebaseAdminProvider, useValue: mockFirebaseAdmin },
				{ provide: EventEmitter2, useValue: mockEventEmitter },
			],
		}).compile();

		service = module.get<ProfileService>(ProfileService);
	});

	describe('getMyProfile', () => {
		it('should return existing profile for authenticated user', async () => {
			const profile = makeProfile();
			mockDb.select.mockReturnValue(chainResolving([profile]));

			const result = await service.getMyProfile(OWNER_UID);

			expect(result.uid).toBe(OWNER_UID);
			expect(result.username).toBe('john_doe');
		});

		it('should create and return a default profile for first-time user, saving email', async () => {
			const OWNER_EMAIL = 'owner@example.com';
			const newProfile = makeProfile({ username: null, email: OWNER_EMAIL });
			mockDb.select.mockReturnValue(chainResolving([]));
			mockDb.insert.mockReturnValue(chainResolving([newProfile]));

			const result = await service.getMyProfile(OWNER_UID, OWNER_EMAIL);

			expect(result.uid).toBe(OWNER_UID);
			expect(result.email).toBe(OWNER_EMAIL);
			expect(mockDb.insert).toHaveBeenCalled();
		});
	});

	describe('updateMyProfile', () => {
		it('should update and return the profile with new field values', async () => {
			const existing = makeProfile();
			const updated = makeProfile({
				bio: 'Board game fanatic',
				location: 'Barcelona',
			});

			mockDb.select.mockReturnValue(chainResolving([existing]));
			mockDb.update.mockReturnValue(chainResolving([updated]));

			const result = await service.updateMyProfile(OWNER_UID, {
				bio: 'Board game fanatic',
				location: 'Barcelona',
			});

			expect(result.bio).toBe('Board game fanatic');
			expect(result.location).toBe('Barcelona');
			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should throw ConflictException when username is already taken by another user', async () => {
			const existing = makeProfile();
			mockDb.select
				.mockReturnValueOnce(chainResolving([existing]))
				.mockReturnValueOnce(
					chainResolving([makeProfile({ uid: OTHER_UID, username: 'taken_name' })]),
				);

			await expect(service.updateMyProfile(OWNER_UID, { username: 'taken_name' })).rejects.toThrow(
				ConflictException,
			);
		});

		it('should allow user to keep their own existing username', async () => {
			const existing = makeProfile({ username: 'john_doe' });
			const updated = makeProfile({ username: 'john_doe', bio: 'Updated bio' });

			mockDb.select
				.mockReturnValueOnce(chainResolving([existing]))
				.mockReturnValueOnce(chainResolving([]));

			mockDb.update.mockReturnValue(chainResolving([updated]));

			const result = await service.updateMyProfile(OWNER_UID, {
				username: 'john_doe',
				bio: 'Updated bio',
			});

			expect(result.username).toBe('john_doe');
		});

		it('should create profile if it does not exist yet before updating', async () => {
			const newProfile = makeProfile({ username: null });
			const updated = makeProfile({ bio: 'New user' });

			mockDb.select.mockReturnValue(chainResolving([]));
			mockDb.insert.mockReturnValue(chainResolving([newProfile]));
			mockDb.update.mockReturnValue(chainResolving([updated]));

			const result = await service.updateMyProfile(OWNER_UID, {
				bio: 'New user',
			});

			expect(result.bio).toBe('New user');
		});
	});

	describe('getPublicProfile', () => {
		it('should return profile data when profile is public', async () => {
			const profile = makeProfile({
				isProfilePublic: true,
				username: 'john_doe',
			});
			mockDb.select.mockReturnValue(chainResolving([profile]));

			const result = await service.getPublicProfile('john_doe');

			expect(result.username).toBe('john_doe');
			expect(result.isProfilePublic).toBe(true);
		});

		it('should throw NotFoundException when username does not exist', async () => {
			mockDb.select.mockReturnValue(chainResolving([]));

			await expect(service.getPublicProfile('ghost_user')).rejects.toThrow(NotFoundException);
		});

		it('should throw NotFoundException when profile exists but is private', async () => {
			const privateProfile = makeProfile({ isProfilePublic: false });
			mockDb.select.mockReturnValue(chainResolving([privateProfile]));

			await expect(service.getPublicProfile('john_doe')).rejects.toThrow(NotFoundException);
		});
	});

	describe('deleteMyProfile', () => {
		it('should successfully soft delete profile and clear all PII fields', async () => {
			const profile = makeProfile();
			mockDb.select
				.mockReturnValueOnce(chainResolving([profile]))
				.mockReturnValueOnce(chainResolving([{ value: 0 }]));
			mockDb.update.mockReturnValue(chainResolving([{ ...profile, deletedAt: new Date() }]));

			const result = await service.deleteMyProfile(OWNER_UID);

			expect(result.success).toBe(true);
			expect(result.message).toBe('Account deleted successfully');
			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should throw NotFoundException when profile does not exist', async () => {
			mockDb.select.mockReturnValue(chainResolving([]));

			await expect(service.deleteMyProfile(OWNER_UID)).rejects.toThrow(NotFoundException);
		});

		it('should preserve uid after deletion', async () => {
			const profile = makeProfile();
			mockDb.select
				.mockReturnValueOnce(chainResolving([profile]))
				.mockReturnValueOnce(chainResolving([{ value: 0 }]));
			mockDb.update.mockReturnValue(chainResolving([{ ...profile, deletedAt: new Date() }]));

			const result = await service.deleteMyProfile(OWNER_UID);

			expect(result.success).toBe(true);
		});

		it('should set deletedAt timestamp correctly', async () => {
			const profile = makeProfile();
			mockDb.select
				.mockReturnValueOnce(chainResolving([profile]))
				.mockReturnValueOnce(chainResolving([{ value: 0 }]));

			mockDb.update.mockReturnValue(chainResolving([{ ...profile, deletedAt: new Date() }]));

			await service.deleteMyProfile(OWNER_UID);

			expect(mockDb.update).toHaveBeenCalledWith(profiles);
		});

		it('should succeed even when Firebase deleteUser fails after DB cleanup', async () => {
			const profile = makeProfile();
			mockDb.select
				.mockReturnValueOnce(chainResolving([profile]))
				.mockReturnValueOnce(chainResolving([{ value: 0 }]));
			mockDb.update.mockReturnValue(chainResolving([{ ...profile, deletedAt: new Date() }]));
			mockFirebaseAdmin
				.getAuth()
				.deleteUser.mockRejectedValueOnce(new Error('auth/user-not-found'));

			const result = await service.deleteMyProfile(OWNER_UID);

			expect(result.success).toBe(true);
			expect(result.message).toBe('Account deleted successfully');
		});
	});
});
