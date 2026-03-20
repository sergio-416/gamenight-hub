import { signal } from '@angular/core';
import { PwaUpdateService } from '@core/services/pwa-update.service';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { fireEvent, render, screen } from '@testing-library/angular';
import { UpdateBanner } from './update-banner';

function makePwaUpdateService(updateAvailable = false) {
	return {
		updateAvailable: signal(updateAvailable),
		applyUpdate: vi.fn(),
		dismissUpdate: vi.fn(),
	};
}

async function renderBanner(pwaService: ReturnType<typeof makePwaUpdateService>) {
	return render(UpdateBanner, {
		providers: [provideTranslocoTesting(), { provide: PwaUpdateService, useValue: pwaService }],
	});
}

describe('UpdateBanner', () => {
	it('should not render when updateAvailable is false', async () => {
		const service = makePwaUpdateService(false);
		await renderBanner(service);

		expect(screen.queryByTestId('update-banner')).toBeNull();
	});

	it('should render banner when updateAvailable is true', async () => {
		const service = makePwaUpdateService(true);
		await renderBanner(service);

		expect(screen.getByTestId('update-banner')).toBeTruthy();
	});

	it('should render reload and later buttons', async () => {
		const service = makePwaUpdateService(true);
		await renderBanner(service);

		expect(screen.getByTestId('update-reload-btn')).toBeTruthy();
		expect(screen.getByTestId('update-later-btn')).toBeTruthy();
	});

	it('should call applyUpdate when reload button is clicked', async () => {
		const service = makePwaUpdateService(true);
		await renderBanner(service);

		const reloadBtn = screen.getByTestId('update-reload-btn');
		fireEvent.click(reloadBtn);

		expect(service.applyUpdate).toHaveBeenCalled();
	});

	it('should call dismissUpdate when later button is clicked', async () => {
		const service = makePwaUpdateService(true);
		await renderBanner(service);

		const laterBtn = screen.getByTestId('update-later-btn');
		fireEvent.click(laterBtn);

		expect(service.dismissUpdate).toHaveBeenCalled();
	});
});
