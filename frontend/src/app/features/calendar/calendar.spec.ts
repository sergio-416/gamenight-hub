import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { API_CONFIG } from '@core/config/api.config';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { PAGINATION, type CalendarEvent } from '@gamenight-hub/shared';
import { provideTranslocoScope } from '@jsverse/transloco';
import { render, screen } from '@testing-library/angular';
import { Calendar } from './calendar';

describe('Calendar', () => {
	let httpTesting: HttpTestingController;

	const baseUrl = `${API_CONFIG.baseUrl}/events`;

	const createMockEvent = (id: string, title: string, startTime?: Date): CalendarEvent =>
		({
			id,
			title,
			gameId: '507f1f77bcf86cd799439011',
			locationId: '507f1f77bcf86cd799439012',
			startTime: startTime ?? new Date('2026-03-15T19:00:00'),
			endTime: new Date('2026-03-15T23:00:00'),
			maxPlayers: 6,
			description: 'Test description',
			category: 'strategy',
		}) as CalendarEvent;

	function createCurrentMonthEvent(id: string, title: string, day: number): CalendarEvent {
		const now = new Date();
		return createMockEvent(id, title, new Date(now.getFullYear(), now.getMonth(), day, 19, 0));
	}

	function paginateEvents(events: CalendarEvent[]) {
		return {
			data: events,
			total: events.length,
			page: PAGINATION.DEFAULT_PAGE,
			limit: PAGINATION.DEFAULT_LIMIT,
			totalPages: 1,
		};
	}

	async function renderCalendar() {
		const result = await render(Calendar, {
			providers: [
				provideTranslocoTesting(),
				provideTranslocoScope('calendar'),
				provideRouter([]),
				provideHttpClient(),
				provideHttpClientTesting(),
			],
		});

		httpTesting = result.fixture.debugElement.injector.get(HttpTestingController);
		return result;
	}

	async function loadEvents(
		fixture: Awaited<ReturnType<typeof renderCalendar>>['fixture'],
		events: CalendarEvent[] = [],
	): Promise<void> {
		fixture.detectChanges();
		const appRef = fixture.debugElement.injector.get(ApplicationRef);
		const req = httpTesting.expectOne((r) => r.url.startsWith(baseUrl));
		req.flush(paginateEvents(events));
		await appRef.whenStable();
		fixture.detectChanges();
	}

	function flushPendingRequests(): void {
		const pending = httpTesting.match((r) => r.url.startsWith(baseUrl));
		for (const req of pending) req.flush(paginateEvents([]));
	}

	async function flushAndStabilize(
		fixture: Awaited<ReturnType<typeof renderCalendar>>['fixture'],
	): Promise<void> {
		flushPendingRequests();
		const appRef = fixture.debugElement.injector.get(ApplicationRef);
		await appRef.whenStable();
		fixture.detectChanges();
	}

	function queryByTestId(el: HTMLElement, testId: string): HTMLElement | null {
		return el.querySelector(`[data-testid="${testId}"]`);
	}

	function getByTestId(el: HTMLElement, testId: string): HTMLElement {
		const found = queryByTestId(el, testId);
		if (!found) throw new Error(`data-testid="${testId}" not found`);
		return found;
	}

	function clickDayCell(nativeEl: HTMLElement, dayOfMonth: number): HTMLElement {
		const cells = nativeEl.querySelectorAll<HTMLElement>(
			`[data-testid="day-${dayOfMonth}"][data-month="current"]`,
		);
		if (cells.length === 0) throw new Error(`Day cell ${dayOfMonth} not found`);
		const cell = cells[0];
		cell.click();
		return cell;
	}

	afterEach(() => {
		httpTesting.verify();
	});

	describe('display', () => {
		it('should render the calendar section when loaded', async () => {
			const { fixture } = await renderCalendar();
			await loadEvents(fixture);

			expect(screen.getByText(/game night/i)).toBeTruthy();
		});

		it('should display the current month and year', async () => {
			const { fixture } = await renderCalendar();
			await loadEvents(fixture);

			const now = new Date();
			const monthNames = [
				'January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December',
			];
			const expected = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
			expect(screen.getByText(expected)).toBeTruthy();
		});

		it('should show loading state while fetching events', async () => {
			const { fixture } = await renderCalendar();
			fixture.detectChanges();

			expect(screen.getByText('Loading events...')).toBeTruthy();

			const appRef = fixture.debugElement.injector.get(ApplicationRef);
			const req = httpTesting.expectOne((r) => r.url.startsWith(baseUrl));
			req.flush(paginateEvents([]));
			await appRef.whenStable();
			fixture.detectChanges();

			expect(screen.queryByText('Loading events...')).toBeNull();
		});

		it('should fetch events with from/to query params', async () => {
			const { fixture } = await renderCalendar();
			fixture.detectChanges();

			const req = httpTesting.expectOne((r) => r.url.startsWith(baseUrl));
			expect(req.request.method).toBe('GET');
			expect(req.request.url).toContain('from=');
			expect(req.request.url).toContain('to=');
			req.flush(paginateEvents([]));
		});

		it('should display event count in subtitle', async () => {
			const mockEvents = [
				createMockEvent('1', 'Game Night'),
				createMockEvent('2', 'Board Game Bash'),
			];
			const { fixture } = await renderCalendar();
			await loadEvents(fixture, mockEvents);

			expect(screen.getByText(/2 game nights scheduled/i)).toBeTruthy();
		});
	});

	describe('navigation', () => {
		it('should navigate to event detail when an event pill is clicked', async () => {
			const _now = new Date();
			const mockEvent = createCurrentMonthEvent('evt-1', 'Game Night', 15);
			const { fixture } = await renderCalendar();
			await loadEvents(fixture, [mockEvent]);

			const router = fixture.debugElement.injector.get(Router);
			const navigateSpy = vi.spyOn(router, 'navigate');

			const pill = getByTestId(fixture.nativeElement, 'event-pill-evt-1');
			pill.click();
			fixture.detectChanges();

			expect(navigateSpy).toHaveBeenCalledWith(['/events', 'evt-1']);
		});

		it('should navigate to create-event when new event button is clicked', async () => {
			const { fixture } = await renderCalendar();
			await loadEvents(fixture);

			const router = fixture.debugElement.injector.get(Router);
			const navigateSpy = vi.spyOn(router, 'navigate');

			const btn = getByTestId(fixture.nativeElement, 'new-event-btn');
			btn.click();
			fixture.detectChanges();

			expect(navigateSpy).toHaveBeenCalledWith(['/create-event']);
		});

		it('should navigate to event detail when a detail card is clicked', async () => {
			const futureDay = new Date().getDate() + 2;
			const mockEvent = createCurrentMonthEvent('42', 'Card Night', futureDay);
			const { fixture } = await renderCalendar();
			await loadEvents(fixture, [mockEvent]);

			const router = fixture.debugElement.injector.get(Router);
			const navigateSpy = vi.spyOn(router, 'navigate');

			const card = getByTestId(fixture.nativeElement, 'detail-card-42');
			card.click();
			fixture.detectChanges();

			expect(navigateSpy).toHaveBeenCalledWith(['/events', '42']);
		});
	});

	describe('month navigation', () => {
		it('should go to previous month', async () => {
			const { fixture } = await renderCalendar();
			await loadEvents(fixture);

			const initialMonth = fixture.componentInstance.currentMonth();
			const prevBtn = getByTestId(fixture.nativeElement, 'prev-month');
			prevBtn.click();
			fixture.detectChanges();
			flushPendingRequests();

			if (initialMonth === 0) {
				expect(fixture.componentInstance.currentMonth()).toBe(11);
			} else {
				expect(fixture.componentInstance.currentMonth()).toBe(initialMonth - 1);
			}
		});

		it('should go to next month', async () => {
			const { fixture } = await renderCalendar();
			await loadEvents(fixture);

			const initialMonth = fixture.componentInstance.currentMonth();
			const nextBtn = getByTestId(fixture.nativeElement, 'next-month');
			nextBtn.click();
			fixture.detectChanges();
			flushPendingRequests();

			if (initialMonth === 11) {
				expect(fixture.componentInstance.currentMonth()).toBe(0);
			} else {
				expect(fixture.componentInstance.currentMonth()).toBe(initialMonth + 1);
			}
		});

		it('should reset selectedDay on month navigation', async () => {
			const { fixture } = await renderCalendar();
			await loadEvents(fixture);

			clickDayCell(fixture.nativeElement, 15);
			fixture.detectChanges();
			expect(fixture.componentInstance.selectedDay()).not.toBeNull();

			const nextBtn = getByTestId(fixture.nativeElement, 'next-month');
			nextBtn.click();
			fixture.detectChanges();
			flushPendingRequests();

			expect(fixture.componentInstance.selectedDay()).toBeNull();
		});

		it('should reset to current month on today button click', async () => {
			const { fixture } = await renderCalendar();
			await loadEvents(fixture);

			const nextBtn1 = getByTestId(fixture.nativeElement, 'next-month');
			nextBtn1.click();
			fixture.detectChanges();
			await flushAndStabilize(fixture);

			const nextBtn2 = getByTestId(fixture.nativeElement, 'next-month');
			nextBtn2.click();
			fixture.detectChanges();
			await flushAndStabilize(fixture);

			const todayBtn = getByTestId(fixture.nativeElement, 'today-btn');
			todayBtn.click();
			fixture.detectChanges();
			flushPendingRequests();

			const now = new Date();
			expect(fixture.componentInstance.currentMonth()).toBe(now.getMonth());
			expect(fixture.componentInstance.currentYear()).toBe(now.getFullYear());
		});
	});

	describe('day selection (Option C)', () => {
		it('should toggle selectedDay on day click', async () => {
			const { fixture } = await renderCalendar();
			await loadEvents(fixture);

			clickDayCell(fixture.nativeElement, 15);
			fixture.detectChanges();
			expect(fixture.componentInstance.selectedDay()?.getDate()).toBe(15);

			clickDayCell(fixture.nativeElement, 15);
			fixture.detectChanges();
			expect(fixture.componentInstance.selectedDay()).toBeNull();
		});

		it('should switch selectedDay when clicking a different day', async () => {
			const { fixture } = await renderCalendar();
			await loadEvents(fixture);

			clickDayCell(fixture.nativeElement, 15);
			fixture.detectChanges();
			expect(fixture.componentInstance.selectedDay()?.getDate()).toBe(15);

			clickDayCell(fixture.nativeElement, 20);
			fixture.detectChanges();
			expect(fixture.componentInstance.selectedDay()?.getDate()).toBe(20);
		});
	});
});
