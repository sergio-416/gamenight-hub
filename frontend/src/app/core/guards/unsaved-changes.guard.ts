import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '@core/services/confirm-dialog.service';

interface HasUnsavedChanges {
	hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
	if (!component.hasUnsavedChanges()) return true;
	return inject(ConfirmDialogService).confirm(
		'You have unsaved changes that will be lost.',
		'Leave this page?',
	);
};
