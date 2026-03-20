import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { PwaUpdateService } from './pwa-update.service';

describe('PwaUpdateService', () => {
	const versionUpdates$ = new Subject<{ type: string }>();

	const mockSwUpdate = {
		isEnabled: true,
		versionUpdates: versionUpdates$.asObservable(),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [PwaUpdateService, { provide: SwUpdate, useValue: mockSwUpdate }],
		});
		mockSwUpdate.isEnabled = true;
	});

	it('should start with updateAvailable as false', () => {
		const service = TestBed.inject(PwaUpdateService);

		expect(service.updateAvailable()).toBe(false);
	});

	it('should set updateAvailable to true on VERSION_READY', () => {
		const service = TestBed.inject(PwaUpdateService);

		versionUpdates$.next({ type: 'VERSION_READY' });

		expect(service.updateAvailable()).toBe(true);
	});

	it('should not set updateAvailable for VERSION_DETECTED events', () => {
		const service = TestBed.inject(PwaUpdateService);

		versionUpdates$.next({ type: 'VERSION_DETECTED' });

		expect(service.updateAvailable()).toBe(false);
	});

	it('should not set updateAvailable for VERSION_INSTALLATION_FAILED events', () => {
		const service = TestBed.inject(PwaUpdateService);

		versionUpdates$.next({ type: 'VERSION_INSTALLATION_FAILED' });

		expect(service.updateAvailable()).toBe(false);
	});

	it('should set updateAvailable to false on dismissUpdate', () => {
		const service = TestBed.inject(PwaUpdateService);

		versionUpdates$.next({ type: 'VERSION_READY' });
		expect(service.updateAvailable()).toBe(true);

		service.dismissUpdate();
		expect(service.updateAvailable()).toBe(false);
	});

	it('should call document.location.reload on applyUpdate', () => {
		const service = TestBed.inject(PwaUpdateService);
		const reloadSpy = vi.fn();
		Object.defineProperty(document, 'location', {
			value: { reload: reloadSpy },
			writable: true,
			configurable: true,
		});

		service.applyUpdate();

		expect(reloadSpy).toHaveBeenCalled();
	});

	it('should not subscribe to versionUpdates when SW is disabled', () => {
		mockSwUpdate.isEnabled = false;

		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [PwaUpdateService, { provide: SwUpdate, useValue: mockSwUpdate }],
		});

		const service = TestBed.inject(PwaUpdateService);

		versionUpdates$.next({ type: 'VERSION_READY' });

		expect(service.updateAvailable()).toBe(false);
	});
});
