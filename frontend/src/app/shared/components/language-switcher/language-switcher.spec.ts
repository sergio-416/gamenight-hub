import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import { TranslocoService } from "@jsverse/transloco";
import { fireEvent, render, screen } from "@testing-library/angular";
import { LanguageSwitcher } from "./language-switcher";

const NATIVE_NAMES = [
	"English",
	"Español",
	"Català",
	"Français",
	"Deutsch",
	"Português",
	"Italiano",
];

async function renderSwitcher() {
	return render(LanguageSwitcher, {
		providers: [provideTranslocoTesting()],
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

describe("LanguageSwitcher", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should create the component", async () => {
		const { fixture } = await renderSwitcher();
		expect(fixture.componentInstance).toBeTruthy();
	});

	it("should render globe trigger button", async () => {
		await renderSwitcher();
		const trigger = getTrigger();
		expect(trigger).toBeTruthy();
		expect(trigger.querySelector("svg")).toBeTruthy();
		expect(trigger.textContent).toContain("EN");
	});

	it("should not show dropdown initially", async () => {
		await renderSwitcher();
		expect(getDropdown()).toBeFalsy();
	});

	it("should open dropdown on trigger click", async () => {
		await renderSwitcher();
		fireEvent.click(getTrigger());
		expect(getDropdown()).toBeTruthy();
	});

	it("should display all 7 languages in dropdown", async () => {
		await renderSwitcher();
		fireEvent.click(getTrigger());
		expect(getOptions()).toHaveLength(7);
	});

	it("should show native language names", async () => {
		await renderSwitcher();
		fireEvent.click(getTrigger());
		const options = getOptions();
		for (const name of NATIVE_NAMES) {
			expect(options.some((opt) => opt.textContent?.includes(name))).toBe(true);
		}
	});

	it("should mark active language with aria-selected", async () => {
		await renderSwitcher();
		fireEvent.click(getTrigger());
		const options = getOptions();
		const active = options.find(
			(opt) => opt.getAttribute("aria-selected") === "true",
		);
		expect(active).toBeTruthy();
		expect(active!.textContent).toContain("English");
	});

	it("should switch language on option click", async () => {
		const { fixture } = await renderSwitcher();
		const transloco = fixture.debugElement.injector.get(TranslocoService);
		fireEvent.click(getTrigger());
		const esOption = getOptions().find((opt) =>
			opt.textContent?.includes("Español"),
		);
		fireEvent.click(esOption!);
		expect(transloco.getActiveLang()).toBe("es");
	});

	it("should close dropdown after selection", async () => {
		await renderSwitcher();
		fireEvent.click(getTrigger());
		expect(getDropdown()).toBeTruthy();
		const esOption = getOptions().find((opt) =>
			opt.textContent?.includes("Español"),
		);
		fireEvent.click(esOption!);
		expect(getDropdown()).toBeFalsy();
	});

	it("should persist selection to localStorage", async () => {
		await renderSwitcher();
		fireEvent.click(getTrigger());
		const frOption = getOptions().find((opt) =>
			opt.textContent?.includes("Français"),
		);
		fireEvent.click(frOption!);
		expect(localStorage.getItem("transloco-lang")).toBe("fr");
	});

	it("should close dropdown on Escape key", async () => {
		const { fixture } = await renderSwitcher();
		fireEvent.click(getTrigger());
		expect(getDropdown()).toBeTruthy();
		fireEvent.keyDown(document, { key: "Escape" });
		fixture.detectChanges();
		expect(getDropdown()).toBeFalsy();
	});

	it("should close dropdown on click outside", async () => {
		await renderSwitcher();
		fireEvent.click(getTrigger());
		expect(getDropdown()).toBeTruthy();
		fireEvent.click(document.body);
		expect(getDropdown()).toBeFalsy();
	});

	it("should set aria-expanded correctly", async () => {
		await renderSwitcher();
		const trigger = getTrigger();
		expect(trigger.getAttribute("aria-expanded")).toBe("false");
		fireEvent.click(trigger);
		expect(trigger.getAttribute("aria-expanded")).toBe("true");
		fireEvent.click(trigger);
		expect(trigger.getAttribute("aria-expanded")).toBe("false");
	});
});
