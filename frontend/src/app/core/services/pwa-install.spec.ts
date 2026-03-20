import { Component, inject } from "@angular/core";
import { render } from "@testing-library/angular";
import { PwaInstallService } from "./pwa-install.service";

const STORAGE_KEY = "pwa-install-dismissed";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function createMockPromptEvent(): BeforeInstallPromptEvent {
	const event = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
	Object.defineProperty(event, "prompt", {
		value: vi.fn().mockResolvedValue({ outcome: "accepted" as const }),
		writable: true,
	});
	Object.defineProperty(event, "platforms", { value: [], writable: true });
	Object.defineProperty(event, "userChoice", {
		value: Promise.resolve({ outcome: "accepted" as const }),
		writable: true,
	});
	return event;
}

@Component({ selector: "app-test-host", template: "", standalone: true })
class TestHost {
	service = inject(PwaInstallService);
}

async function setupService() {
	const { fixture } = await render(TestHost);
	fixture.detectChanges();
	await fixture.whenStable();
	return fixture.componentInstance.service;
}

describe("PwaInstallService", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("should start with canInstall as false", async () => {
		const service = await setupService();

		expect(service.canInstall()).toBe(false);
	});

	it("should set canInstall to true after beforeinstallprompt event", async () => {
		const service = await setupService();

		window.dispatchEvent(createMockPromptEvent());

		expect(service.canInstall()).toBe(true);
	});

	it("should call prompt on the deferred event when promptInstall is called", async () => {
		const service = await setupService();
		const event = createMockPromptEvent();

		window.dispatchEvent(event);
		await service.promptInstall();

		expect(event.prompt).toHaveBeenCalled();
	});

	it("should set canInstall to false after promptInstall", async () => {
		const service = await setupService();
		const event = createMockPromptEvent();

		window.dispatchEvent(event);
		expect(service.canInstall()).toBe(true);

		await service.promptInstall();
		expect(service.canInstall()).toBe(false);
	});

	it("should set canInstall to false on dismiss", async () => {
		const service = await setupService();

		window.dispatchEvent(createMockPromptEvent());
		expect(service.canInstall()).toBe(true);

		service.dismiss();
		expect(service.canInstall()).toBe(false);
	});

	it("should write timestamp to localStorage on dismiss", async () => {
		const service = await setupService();

		service.dismiss();

		const stored = localStorage.getItem(STORAGE_KEY);
		expect(stored).toBeTruthy();
		expect(new Date(stored!).getTime()).toBeLessThanOrEqual(Date.now());
	});

	it("should keep canInstall false when localStorage has unexpired dismiss timestamp", async () => {
		localStorage.setItem(
			STORAGE_KEY,
			new Date(Date.now() - 1000).toISOString(),
		);

		const service = await setupService();
		window.dispatchEvent(createMockPromptEvent());

		expect(service.canInstall()).toBe(false);
	});

	it("should allow canInstall when localStorage dismiss timestamp has expired", async () => {
		localStorage.setItem(
			STORAGE_KEY,
			new Date(Date.now() - COOLDOWN_MS - 1000).toISOString(),
		);

		const service = await setupService();
		window.dispatchEvent(createMockPromptEvent());

		expect(service.canInstall()).toBe(true);
	});

	it("should do nothing when promptInstall is called without a deferred event", async () => {
		const service = await setupService();

		await expect(service.promptInstall()).resolves.toBeUndefined();
		expect(service.canInstall()).toBe(false);
	});
});
