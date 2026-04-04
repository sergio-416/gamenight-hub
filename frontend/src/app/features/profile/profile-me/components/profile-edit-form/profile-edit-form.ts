import { CdkTrapFocus } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	input,
	output,
	signal,
} from '@angular/core';
import { ProfileService } from '@core/services/profile.service';
import { formatFullDate } from '@core/utils/date-format';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import type { Profile, UpdateProfileDto } from '@gamenight-hub/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { DeleteAccountDialog } from '@shared/components/delete-account-dialog/delete-account-dialog';
import { XpHistory } from '@shared/components/xp-history/xp-history';

@Component({
	selector: 'app-profile-edit-form',
	imports: [CdkTrapFocus, FontAwesomeModule, TranslocoDirective, DeleteAccountDialog, XpHistory],
	templateUrl: './profile-edit-form.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditForm {
	readonly profile = input.required<Profile>();
	readonly nameFieldsLocked = input(false);
	readonly nameCooldownDaysRemaining = input(0);
	readonly nameUnlockDate = input('');

	readonly saved = output<Profile>();
	readonly cancelled = output<void>();
	readonly logoutRequested = output<void>();
	readonly accountDeleted = output<void>();

	readonly saving = signal(false);
	readonly saveError = signal<string | null>(null);
	readonly editForm = signal<UpdateProfileDto>({});
	readonly showPrivateProfileModal = signal(false);
	readonly showDeleteAccountDialog = signal(false);

	readonly #profileService = inject(ProfileService);
	readonly #transloco = inject(TranslocoService);

	readonly iconLock = faLock;

	constructor() {
		effect(() => {
			const p = this.profile();
			this.editForm.set({
				username: p?.username ?? undefined,
				bio: p?.bio ?? undefined,
				location: p?.location ?? undefined,
				firstName: p?.firstName ?? undefined,
				lastName: p?.lastName ?? undefined,
				mobilePhone: p?.mobilePhone ?? undefined,
				birthday: p?.birthday ?? undefined,
				backupEmail: p?.backupEmail ?? undefined,
				isProfilePublic: p?.isProfilePublic ?? false,
				useRealNameForContact: p?.useRealNameForContact ?? false,
				showFirstName: p?.showFirstName ?? false,
				showLastName: p?.showLastName ?? false,
				showLocation: p?.showLocation ?? false,
				showEmail: p?.showEmail ?? false,
				showMobilePhone: p?.showMobilePhone ?? false,
				showBirthday: p?.showBirthday ?? false,
				showBackupEmail: p?.showBackupEmail ?? false,
				showGameCollection: p?.showGameCollection ?? true,
			});
		});
	}

	save(): void {
		this.saving.set(true);
		this.saveError.set(null);

		const dto = { ...this.editForm() };
		if (this.nameFieldsLocked()) {
			delete dto.firstName;
			delete dto.lastName;
		}

		this.#profileService.updateMyProfile(dto).subscribe({
			next: (p) => {
				this.saving.set(false);
				this.saved.emit(p);
			},
			error: (err: unknown) => {
				this.saving.set(false);
				if (err instanceof HttpErrorResponse && err.status === 400) {
					const msg = err.error?.message;
					this.saveError.set(
						typeof msg === 'string' ? msg : 'Invalid data. Please check your inputs.',
					);
				} else if (err instanceof HttpErrorResponse && err.status === 409) {
					this.saveError.set('That username is already taken. Please choose another.');
				} else {
					this.saveError.set('Something went wrong. Please try again.');
				}
			},
		});
	}

	cancel(): void {
		this.cancelled.emit();
	}

	updateField(field: keyof UpdateProfileDto, value: string | boolean): void {
		this.editForm.update((f) => ({ ...f, [field]: value }));
	}

	onPublicProfileToggle(): void {
		const currentlyPublic = this.editForm().isProfilePublic;
		if (currentlyPublic) {
			this.showPrivateProfileModal.set(true);
		} else {
			this.updateField('isProfilePublic', true);
		}
	}

	confirmMakePrivate(): void {
		this.updateField('isProfilePublic', false);
		this.showPrivateProfileModal.set(false);
	}

	cancelMakePrivate(): void {
		this.showPrivateProfileModal.set(false);
	}

	formatBirthday(birthday: string): string {
		return formatFullDate(new Date(birthday), this.#transloco.getActiveLang());
	}

	readonly hasOriginalName = computed(
		() => !!this.profile()?.firstName || !!this.profile()?.lastName,
	);
}
