import { provideRouter, Router } from "@angular/router";
import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import { fireEvent, render, screen } from "@testing-library/angular";
import { OfflineFallback } from "./offline-fallback";

async function renderFallback() {
	return render(OfflineFallback, {
		providers: [
			provideRouter([{ path: "home", component: OfflineFallback }]),
			provideTranslocoTesting(),
		],
	});
}

describe("OfflineFallback", () => {
	it("should render the offline fallback container", async () => {
		await renderFallback();

		expect(screen.getByTestId("offline-fallback")).toBeTruthy();
	});

	it("should render the retry button", async () => {
		await renderFallback();

		expect(screen.getByTestId("offline-retry-btn")).toBeTruthy();
	});

	it("should call window.location.reload when retry button is clicked", async () => {
		const reloadSpy = vi.fn();
		Object.defineProperty(window, "location", {
			value: { ...window.location, reload: reloadSpy },
			writable: true,
			configurable: true,
		});

		await renderFallback();

		const retryBtn = screen.getByTestId("offline-retry-btn");
		fireEvent.click(retryBtn);

		expect(reloadSpy).toHaveBeenCalled();
	});

	it("should navigate to /home when online event fires", async () => {
		const { fixture } = await renderFallback();
		fixture.detectChanges();
		await fixture.whenStable();

		const router = fixture.debugElement.injector.get(Router);
		const navigateSpy = vi.spyOn(router, "navigateByUrl");

		window.dispatchEvent(new Event("online"));

		expect(navigateSpy).toHaveBeenCalledWith("/home");
	});
});
