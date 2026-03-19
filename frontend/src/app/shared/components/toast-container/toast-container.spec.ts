import { ToastService } from "@core/services/toast";
import { fireEvent, render, screen, within } from "@testing-library/angular";
import { ToastContainer } from "./toast-container";

describe("ToastContainer", () => {
	let fixture: Awaited<ReturnType<typeof render>>["fixture"];
	let toastService: ToastService;

	beforeEach(async () => {
		const rendered = await render(ToastContainer, {
			providers: [ToastService],
		});

		fixture = rendered.fixture;
		toastService = fixture.debugElement.injector.get(ToastService);
	});

	afterEach(() => {
		const toasts = toastService.toasts();
		toasts.forEach((toast) => {
			toastService.dismiss(toast.id);
		});
		vi.clearAllMocks();
	});

	describe("displaying toasts", () => {
		it("should display toast when ToastService shows a message", () => {
			toastService.show("Operation successful", "success");
			fixture.detectChanges();

			expect(screen.getByText("Operation successful")).toBeTruthy();
			expect(screen.getByTestId("toast-success")).toBeTruthy();
		});

		it("should display multiple toasts simultaneously", () => {
			toastService.success("First message");
			toastService.error("Second message");
			toastService.info("Third message");
			fixture.detectChanges();

			expect(screen.getByText("First message")).toBeTruthy();
			expect(screen.getByText("Second message")).toBeTruthy();
			expect(screen.getByText("Third message")).toBeTruthy();
		});

		it("should not display toasts when no toasts are active", () => {
			fixture.detectChanges();

			expect(screen.queryByText("Operation successful")).toBeFalsy();
		});
	});

	describe("toast types", () => {
		it("should display success toast with correct styling", () => {
			toastService.success("Success message");
			fixture.detectChanges();

			const toast = screen.getByTestId("toast-success");
			expect(toast.className).toContain("border-l-emerald-500");
		});

		it("should display error toast with correct styling", () => {
			toastService.error("Error message");
			fixture.detectChanges();

			const toast = screen.getByTestId("toast-error");
			expect(toast.className).toContain("border-l-pink-600");
		});

		it("should display warning toast with correct styling", () => {
			toastService.warning("Warning message");
			fixture.detectChanges();

			const toast = screen.getByTestId("toast-warning");
			expect(toast.className).toContain("border-l-amber-500");
		});

		it("should display info toast with correct styling", () => {
			toastService.info("Info message");
			fixture.detectChanges();

			const toast = screen.getByTestId("toast-info");
			expect(toast.className).toContain("border-l-blue-500");
		});
	});

	describe("dismissing toasts", () => {
		it("should remove toast when close button is clicked", () => {
			toastService.success("Dismissible message");
			fixture.detectChanges();

			expect(screen.getByText("Dismissible message")).toBeTruthy();

			const closeButton = screen.getByRole("button", { name: /Close/ });
			fireEvent.click(closeButton);
			fixture.detectChanges();

			expect(screen.queryByText("Dismissible message")).toBeFalsy();
		});

		it("should only remove the specific toast when multiple toasts exist", () => {
			toastService.success("First message");
			toastService.error("Second message");
			fixture.detectChanges();

			const successToast = screen.getByTestId("toast-success");
			const closeButton = within(successToast).getByRole("button", {
				name: /Close/,
			});
			fireEvent.click(closeButton);
			fixture.detectChanges();

			expect(screen.queryByText("First message")).toBeFalsy();
			expect(screen.getByText("Second message")).toBeTruthy();
		});
	});

	describe("auto-dismiss behavior", () => {
		it("should auto-dismiss toast after specified duration", async () => {
			vi.useFakeTimers();

			toastService.show("Auto-dismiss message", "info", 1000);
			fixture.detectChanges();

			expect(screen.getByTestId("toast-info")).toBeTruthy();

			vi.advanceTimersByTime(1000);
			fixture.detectChanges();

			expect(screen.queryByTestId("toast-info")).toBeFalsy();

			vi.useRealTimers();
		});

		it("should not auto-dismiss toast when duration is 0", async () => {
			vi.useFakeTimers();

			toastService.show("Persistent message", "success", 0);
			fixture.detectChanges();

			vi.advanceTimersByTime(10000);
			fixture.detectChanges();

			expect(screen.getByTestId("toast-success")).toBeTruthy();

			vi.useRealTimers();
		});
	});
});
