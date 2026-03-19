import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import { ThemeService } from "@core/services/theme.service";
import { fireEvent, render, screen } from "@testing-library/angular";
import { ThemeToggle } from "./theme-toggle";

function createMockThemeService() {
	return {
		isDark: vi.fn().mockReturnValue(false),
		toggle: vi.fn(),
		theme: vi.fn().mockReturnValue("light"),
	};
}

async function renderToggle(themeService = createMockThemeService()) {
	return render(ThemeToggle, {
		providers: [
			provideTranslocoTesting(),
			{ provide: ThemeService, useValue: themeService },
		],
	});
}

describe("ThemeToggle", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("creates the component", async () => {
		const { fixture } = await renderToggle();
		expect(fixture.componentInstance).toBeTruthy();
	});

	it("renders moon icon when in light mode", async () => {
		const themeService = createMockThemeService();
		themeService.isDark.mockReturnValue(false);
		await renderToggle(themeService);
		const button = screen.getByRole("button");
		const svg = button.querySelector("svg");
		expect(svg).toBeTruthy();
		const path = svg!.querySelector("path");
		expect(path!.getAttribute("d")).toContain("21.752");
	});

	it("renders sun icon when in dark mode", async () => {
		const themeService = createMockThemeService();
		themeService.isDark.mockReturnValue(true);
		await renderToggle(themeService);
		const button = screen.getByRole("button");
		const svg = button.querySelector("svg");
		expect(svg).toBeTruthy();
		const path = svg!.querySelector("path");
		expect(path!.getAttribute("d")).toContain("M12 3v2.25");
	});

	it("calls toggle on button click", async () => {
		const themeService = createMockThemeService();
		await renderToggle(themeService);
		const button = screen.getByRole("button");
		fireEvent.click(button);
		expect(themeService.toggle).toHaveBeenCalled();
	});
});
