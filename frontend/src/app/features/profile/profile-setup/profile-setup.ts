import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { ProfileService } from '@core/services/profile.service';
import { PROFILE_CONSTRAINTS, type UpdateProfileDto } from '@gamenight-hub/shared';
import { TranslocoDirective } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

interface ProfileFormModel {
	firstName: string;
	lastName: string;
	username: string;
	useRealNameForContact: boolean;
	backupEmail: string;
	mobilePhone: string;
	location: string;
	postalZip: string;
	birthday: string;
	bio: string;
	isProfilePublic: boolean;
	showFirstName: boolean;
	showLastName: boolean;
	showLocation: boolean;
	showPostalZip: boolean;
	showBirthday: boolean;
	showMobilePhone: boolean;
	showBackupEmail: boolean;
	showEmail: boolean;
	showGameCollection: boolean;
}

@Component({
	selector: 'app-profile-setup',
	imports: [FormField, TranslocoDirective],
	templateUrl: './profile-setup.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSetup {
	readonly #profileService = inject(ProfileService);
	readonly #router = inject(Router);

	readonly loading = signal(false);
	readonly error = signal<string | null>(null);

	readonly #profileModel = signal<ProfileFormModel>({
		firstName: '',
		lastName: '',
		username: '',
		useRealNameForContact: false,
		backupEmail: '',
		mobilePhone: '',
		location: '',
		postalZip: '',
		birthday: '',
		bio: '',
		isProfilePublic: true,
		showFirstName: true,
		showLastName: true,
		showLocation: false,
		showPostalZip: false,
		showBirthday: false,
		showMobilePhone: false,
		showBackupEmail: false,
		showEmail: false,
		showGameCollection: true,
	});

	readonly profileForm = form(this.#profileModel, (p) => {
		required(p.firstName, { message: 'First name is required' });
		required(p.lastName, { message: 'Last name is required' });
		required(p.username, { message: 'Username is required' });
		maxLength(p.bio, PROFILE_CONSTRAINTS.BIO_MAX, {
			message: 'Bio must be at most 300 characters',
		});
	});

	async save(event: Event): Promise<void> {
		event.preventDefault();
		submit(this.profileForm, {
			action: async () => {
				this.loading.set(true);
				this.error.set(null);
				try {
					await firstValueFrom(
						this.#profileService.updateMyProfile(this.#profileModel() as UpdateProfileDto),
					);
					await this.#router.navigate(['/profile/me']);
				} catch (err: unknown) {
					if (err instanceof HttpErrorResponse && err.status === 400) {
						const issues = err.error?.message;
						const first = Array.isArray(issues) ? issues[0]?.message : null;
						this.error.set(first ?? 'Invalid data. Please check your inputs.');
					} else if (err instanceof HttpErrorResponse && err.status === 409) {
						this.error.set('That username is already taken. Please choose another.');
					} else {
						this.error.set('Something went wrong. Please try again.');
					}
					this.loading.set(false);
				}
			},
		});
	}

	async skip(): Promise<void> {
		await this.#router.navigate(['/home']);
	}
}
