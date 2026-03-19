import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import { ThemeService } from "@core/services/theme.service";
import { fireEvent, render, screen } from "@testing-library/angular";
import { CvdSelector } from "./cvd-selector";

function createMockThemeService() {
	return {
		cvdMode: vi.fn().mockReturnValue("none"),
		setCvdMode: vi.fn(),
		CVD_MODES: ["none", "protanopia", "deuteranopia", "tritanopia"],
	};
}

async function renderSelector(themeService = createMockThemeService()) {
	return render(CvdSelector, {
		providers: [
			provideTranslocoTesting(),
			{ provide: ThemeService, useValue: themeService },
		],
	});
}

function getTrigger() {
	return screen.getByRole("button");
}

function getDropdown() {
	return screen.queryByRole("listbox");
}

function getOptions() {
	return screen.getAllByRole("option");
}

describe("CvdSelector", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should create the component", async () => {
		const { fixture } = await renderSelector();
		expect(fixture.componentInstance).toBeTruthy();
	});

	it("should render eye icon trigger button", async () => {
		await renderSelector();
		const trigger = getTrigger();
		expect(trigger).toBeTruthy();
		expect(trigger.querySelector("svg")).toBeTruthy();
	});

	it("should not show dropdown initially", async () => {
		await renderSelector();
		expect(getDropdown()).toBeFalsy();
	});

	it("should open dropdown on trigger click", async () => {
		await renderSelector();
		fireEvent.click(getTrigger());
		expect(getDropdown()).toBeTruthy();
	});

	it("should display all 4 CVD options", async () => {
		await renderSelector();
		fireEvent.click(getTrigger());
		expect(getOptions()).toHaveLength(4);
	});

	it("should mark active mode with aria-selected", async () => {
		await renderSelector();
		fireEvent.click(getTrigger());
		const options = getOptions();
		const active = options.find(
			(opt) => opt.getAttribute("aria-selected") === "true",
		);
		expect(active).toBeTruthy();
	});

	it("should highlight protanopia when active", async () => {
		const themeService = createMockThemeService();
		themeService.cvdMode.mockReturnValue("protanopia");
		await renderSelector(themeService);
		fireEvent.click(getTrigger());
		const options = getOptions();
		const active = options.find(
			(opt) => opt.getAttribute("aria-selected") === "true",
		);
		expect(active).toBeTruthy();
		expect(active!.classList.contains("text-emerald-400")).toBe(true);
	});

	it("should call setCvdMode on option click", async () => {
		const themeService = createMockThemeService();
		await renderSelector(themeService);
		fireEvent.click(getTrigger());
		const options = getOptions();
		fireEvent.click(options[1]);
		expect(themeService.setCvdMode).toHaveBeenCalledWith("protanopia");
	});

	it("should close dropdown after selection", async () => {
		await renderSelector();
		fireEvent.click(getTrigger());
		expect(getDropdown()).toBeTruthy();
		const options = getOptions();
		fireEvent.click(options[1]);
		expect(getDropdown()).toBeFalsy();
	});

	it("should close dropdown on click outside", async () => {
		await renderSelector();
		fireEvent.click(getTrigger());
		expect(getDropdown()).toBeTruthy();
		fireEvent.click(document.body);
		expect(getDropdown()).toBeFalsy();
	});

	it("should close dropdown on Escape key", async () => {
		const { fixture } = await renderSelector();
		fireEvent.click(getTrigger());
		expect(getDropdown()).toBeTruthy();
		fireEvent.keyDown(document, { key: "Escape" });
		fixture.detectChanges();
		expect(getDropdown()).toBeFalsy();
	});

	it("should set aria-expanded correctly", async () => {
		await renderSelector();
		const trigger = getTrigger();
		expect(trigger.getAttribute("aria-expanded")).toBe("false");
		fireEvent.click(trigger);
		expect(trigger.getAttribute("aria-expanded")).toBe("true");
		fireEvent.click(trigger);
		expect(trigger.getAttribute("aria-expanded")).toBe("false");
	});
});
