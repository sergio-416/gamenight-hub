import { signal } from "@angular/core";
import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import { render, screen } from "@testing-library/angular";
import { XpService } from "@shared/services/xp.service";
import type { XpAwardFeedback } from "@shared/models/xp.model";
import { XpFeedback } from "./xp-feedback";

function makeXpService(feedback: XpAwardFeedback | null = null) {
	return {
		xpFeedback: signal(feedback),
		profile: signal(null),
		profileLoading: signal(false),
		profileError: signal(null),
	};
}

async function renderFeedback(xpService: ReturnType<typeof makeXpService>) {
	return render(XpFeedback, {
		providers: [
			provideTranslocoTesting(),
			{ provide: XpService, useValue: xpService },
		],
	});
}

describe("XpFeedback", () => {
	it("should not render when feedback is null", async () => {
		await renderFeedback(makeXpService(null));

		expect(screen.queryByTestId("xp-feedback")).toBeNull();
	});

	it("should show XP amount when feedback is set", async () => {
		await renderFeedback(
			makeXpService({
				xpAwarded: 75,
				action: "game_added",
				levelUp: false,
			}),
		);

		expect(screen.getByTestId("xp-feedback-amount")).toBeTruthy();
		expect(screen.getByText("+75 XP")).toBeTruthy();
	});

	it("should not show level-up info for non-level-up feedback", async () => {
		await renderFeedback(
			makeXpService({
				xpAwarded: 50,
				action: "event_created",
				levelUp: false,
			}),
		);

		expect(screen.queryByTestId("xp-feedback-levelup")).toBeNull();
	});

	it("should show level-up info when levelUp is true", async () => {
		await renderFeedback(
			makeXpService({
				xpAwarded: 100,
				action: "participant_joined",
				levelUp: true,
				newLevel: 4,
			}),
		);

		expect(screen.getByTestId("xp-feedback-levelup")).toBeTruthy();
		expect(screen.getByText(/Level 4/)).toBeTruthy();
	});

	it("should update when feedback signal changes", async () => {
		const xpService = makeXpService(null);
		const { fixture } = await renderFeedback(xpService);

		expect(screen.queryByTestId("xp-feedback")).toBeNull();

		xpService.xpFeedback.set({
			xpAwarded: 200,
			action: "game_added",
			levelUp: false,
		});
		fixture.detectChanges();

		expect(screen.getByText("+200 XP")).toBeTruthy();
	});

	it("should disappear when feedback is cleared", async () => {
		const xpService = makeXpService({
			xpAwarded: 50,
			action: "game_added",
			levelUp: false,
		});
		const { fixture } = await renderFeedback(xpService);

		expect(screen.getByTestId("xp-feedback")).toBeTruthy();

		xpService.xpFeedback.set(null);
		fixture.detectChanges();

		expect(screen.queryByTestId("xp-feedback")).toBeNull();
	});
});
