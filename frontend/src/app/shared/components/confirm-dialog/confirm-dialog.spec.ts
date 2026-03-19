import { fireEvent, render, screen } from "@testing-library/angular";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	async function renderDialog(inputs: Record<string, unknown> = {}) {
		const result = await render(ConfirmDialog, {
			inputs: {
				isOpen: false,
				message: "Are you sure?",
				...inputs,
			},
		});
		return result;
	}

	describe("dialog visibility", () => {
		it("should display confirmation dialog when isOpen is true", async () => {
			await renderDialog({ isOpen: true, message: "Are you sure?" });

			expect(screen.getByTestId("confirm-dialog")).toBeTruthy();
			expect(screen.getByText("Are you sure?")).toBeTruthy();
		});

		it("should hide confirmation dialog when isOpen is false", async () => {
			await renderDialog({ isOpen: false, message: "Are you sure?" });

			expect(screen.queryByTestId("confirm-dialog")).toBeFalsy();
		});

		it("should emit cancelled event when backdrop is clicked", async () => {
			const cancelledSpy = vi.fn();

			await render(ConfirmDialog, {
				inputs: { isOpen: true, message: "Are you sure?" },
				on: { cancelled: cancelledSpy },
			});

			const backdrop = screen.getByTestId("confirm-dialog-backdrop");
			fireEvent.click(backdrop);

			expect(cancelledSpy).toHaveBeenCalled();
		});

		it("should not emit cancelled event when dialog content is clicked", async () => {
			const cancelledSpy = vi.fn();

			await render(ConfirmDialog, {
				inputs: { isOpen: true, message: "Are you sure?" },
				on: { cancelled: cancelledSpy },
			});

			const dialog = screen.getByTestId("confirm-dialog");
			fireEvent.click(dialog);

			expect(cancelledSpy).not.toHaveBeenCalled();
		});
	});

	describe("dialog content", () => {
		it("should display custom title when provided", async () => {
			await renderDialog({
				isOpen: true,
				message: "Delete this item?",
				title: "Delete Confirmation",
			});

			expect(screen.getByText("Delete Confirmation")).toBeTruthy();
		});

		it("should display default title when not provided", async () => {
			await renderDialog({ isOpen: true, message: "Delete this item?" });

			expect(screen.getByText("Confirm Action")).toBeTruthy();
		});

		it("should display the confirmation message", async () => {
			await renderDialog({ isOpen: true, message: "Delete this item?" });

			expect(screen.getByText("Delete this item?")).toBeTruthy();
		});

		it("should display custom button text when provided", async () => {
			await renderDialog({
				isOpen: true,
				message: "Delete this item?",
				confirmText: "Yes, Delete",
				cancelText: "No, Keep It",
			});

			expect(screen.getByRole("button", { name: /Yes, Delete/ })).toBeTruthy();
			expect(screen.getByRole("button", { name: /No, Keep It/ })).toBeTruthy();
		});

		it("should display default button text when not provided", async () => {
			await renderDialog({ isOpen: true, message: "Delete this item?" });

			expect(screen.getByRole("button", { name: /Confirm/ })).toBeTruthy();
			expect(screen.getByRole("button", { name: /Cancel/ })).toBeTruthy();
		});
	});

	describe("keyboard accessibility", () => {
		it("should emit cancelled event when Escape key is pressed", async () => {
			const cancelledSpy = vi.fn();

			const { fixture } = await render(ConfirmDialog, {
				inputs: { isOpen: true, message: "Are you sure?" },
				on: { cancelled: cancelledSpy },
			});

			fixture.nativeElement.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
			);

			expect(cancelledSpy).toHaveBeenCalled();
		});
	});

	describe("dialog actions", () => {
		it("should emit confirmed event when confirm button is clicked", async () => {
			const confirmedSpy = vi.fn();

			await render(ConfirmDialog, {
				inputs: { isOpen: true, message: "Are you sure?" },
				on: { confirmed: confirmedSpy },
			});

			const confirmButton = screen.getByRole("button", { name: /Confirm/ });
			fireEvent.click(confirmButton);

			expect(confirmedSpy).toHaveBeenCalled();
		});

		it("should emit cancelled event when cancel button is clicked", async () => {
			const cancelledSpy = vi.fn();

			await render(ConfirmDialog, {
				inputs: { isOpen: true, message: "Are you sure?" },
				on: { cancelled: cancelledSpy },
			});

			const cancelButton = screen.getByRole("button", { name: /Cancel/ });
			fireEvent.click(cancelButton);

			expect(cancelledSpy).toHaveBeenCalled();
		});
	});

	describe("danger mode", () => {
		it("should apply danger styling to confirm button when danger is true", async () => {
			await renderDialog({
				isOpen: true,
				message: "Delete permanently?",
				danger: true,
			});

			const confirmButton = screen.getByTestId("confirm-button");
			expect(confirmButton.className).toContain("bg-pink-600");
		});

		it("should apply primary styling to confirm button when danger is false", async () => {
			await renderDialog({
				isOpen: true,
				message: "Delete permanently?",
				danger: false,
			});

			const confirmButton = screen.getByTestId("confirm-button");
			expect(confirmButton.className).toContain("bg-emerald-500");
		});
	});
});
