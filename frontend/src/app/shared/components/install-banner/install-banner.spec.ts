import { signal } from "@angular/core";
import { PwaInstallService } from "@core/services/pwa-install.service";
import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import { fireEvent, render, screen } from "@testing-library/angular";
import { InstallBanner } from "./install-banner";

function makePwaInstallService(canInstall = false) {
	return {
		canInstall: signal(canInstall),
		promptInstall: vi.fn(),
		dismiss: vi.fn(),
	};
}

async function renderBanner(
	pwaService: ReturnType<typeof makePwaInstallService>,
) {
	return render(InstallBanner, {
		providers: [
			provideTranslocoTesting(),
			{ provide: PwaInstallService, useValue: pwaService },
		],
	});
}

describe("InstallBanner", () => {
	it("should not render when canInstall is false", async () => {
		const service = makePwaInstallService(false);
		await renderBanner(service);

		expect(screen.queryByTestId("install-banner")).toBeNull();
	});

	it("should render banner when canInstall is true", async () => {
		const service = makePwaInstallService(true);
		await renderBanner(service);

		expect(screen.getByTestId("install-banner")).toBeTruthy();
	});

	it("should render install and dismiss buttons", async () => {
		const service = makePwaInstallService(true);
		await renderBanner(service);

		expect(screen.getByTestId("install-action-btn")).toBeTruthy();
		expect(screen.getByTestId("install-dismiss-btn")).toBeTruthy();
	});

	it("should call promptInstall when install button is clicked", async () => {
		const service = makePwaInstallService(true);
		await renderBanner(service);

		const installBtn = screen.getByTestId("install-action-btn");
		fireEvent.click(installBtn);

		expect(service.promptInstall).toHaveBeenCalled();
	});

	it("should call dismiss when not now button is clicked", async () => {
		const service = makePwaInstallService(true);
		await renderBanner(service);

		const dismissBtn = screen.getByTestId("install-dismiss-btn");
		fireEvent.click(dismissBtn);

		expect(service.dismiss).toHaveBeenCalled();
	});
});
