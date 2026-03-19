import { provideRouter, Router } from "@angular/router";
import { AuthService } from "@core/services/auth";
import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import { fireEvent, render, screen } from "@testing-library/angular";
import { Login } from "./login";

const mockAuthService = {
	login: vi.fn(),
	sendSignInLink: vi.fn(),
};

beforeEach(() => {
	vi.clearAllMocks();
});

async function renderLogin() {
	const result = await render(Login, {
		providers: [
			provideRouter([]),
			provideTranslocoTesting(),
			{ provide: AuthService, useValue: mockAuthService },
		],
	});
	const router = result.fixture.debugElement.injector.get(Router);
	const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);
	return { ...result, navigateSpy };
}

describe("Login", () => {
	it("should show the email input", async () => {
		await renderLogin();
		expect(screen.getByRole("textbox", { name: /email/i })).toBeTruthy();
	});

	it("should show the Google sign-in button", async () => {
		await renderLogin();
		expect(screen.getByRole("button", { name: /google/i })).toBeTruthy();
	});

	it("should show the continue with email button", async () => {
		await renderLogin();
		expect(
			screen.getByRole("button", { name: /continue with email/i }),
		).toBeTruthy();
	});

	it("should not show a password field", async () => {
		await renderLogin();
		expect(screen.queryByLabelText(/password/i)).toBeNull();
	});

	it("should show a validation error when submitting an empty email", async () => {
		await renderLogin();

		fireEvent.click(
			screen.getByRole("button", { name: /continue with email/i }),
		);

		expect(await screen.findByText(/valid email/i)).toBeTruthy();
		expect(mockAuthService.sendSignInLink).not.toHaveBeenCalled();
	});

	it("should call sendSignInLink and navigate to waiting page on valid submit", async () => {
		mockAuthService.sendSignInLink.mockResolvedValue(undefined);
		const { fixture, navigateSpy } = await renderLogin();

		fireEvent.input(screen.getByRole("textbox", { name: /email/i }), {
			target: { value: "user@example.com" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: /continue with email/i }),
		);

		await fixture.whenStable();

		expect(mockAuthService.sendSignInLink).toHaveBeenCalledWith(
			"user@example.com",
		);
		expect(navigateSpy).toHaveBeenCalledWith(["/auth/waiting"]);
	});

	it("should show an inline error when sendSignInLink fails", async () => {
		mockAuthService.sendSignInLink.mockRejectedValue(
			new Error("network-request-failed"),
		);
		await renderLogin();

		fireEvent.input(screen.getByRole("textbox", { name: /email/i }), {
			target: { value: "user@example.com" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: /continue with email/i }),
		);

		expect(await screen.findByText(/network/i)).toBeTruthy();
	});

	it("should call login() when the Google button is clicked", async () => {
		mockAuthService.login.mockResolvedValue({ isNewUser: false });
		await renderLogin();

		fireEvent.click(screen.getByRole("button", { name: /google/i }));

		await vi.waitFor(() => expect(mockAuthService.login).toHaveBeenCalled());
	});

	it("should navigate to /home after Google sign-in for a returning user", async () => {
		mockAuthService.login.mockResolvedValue({ isNewUser: false });
		const { fixture, navigateSpy } = await renderLogin();

		fireEvent.click(screen.getByRole("button", { name: /google/i }));
		await fixture.whenStable();

		expect(navigateSpy).toHaveBeenCalledWith(["/home"]);
	});

	it("should navigate to /profile/setup after Google sign-in for a new user", async () => {
		mockAuthService.login.mockResolvedValue({ isNewUser: true });
		const { fixture, navigateSpy } = await renderLogin();

		fireEvent.click(screen.getByRole("button", { name: /google/i }));
		await fixture.whenStable();

		expect(navigateSpy).toHaveBeenCalledWith(["/profile/setup"]);
	});

	it("should show an inline error when loginWithGoogle fails", async () => {
		mockAuthService.login.mockRejectedValue(
			new Error("network-request-failed"),
		);
		await renderLogin();

		fireEvent.click(screen.getByRole("button", { name: /google/i }));

		expect(await screen.findByText(/network/i)).toBeTruthy();
	});

	it("should show the event organiser application link", async () => {
		await renderLogin();
		expect(screen.getByRole("link", { name: /event organiser/i })).toBeTruthy();
	});
});
