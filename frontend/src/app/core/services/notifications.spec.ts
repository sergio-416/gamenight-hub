import { TestBed } from "@angular/core/testing";
import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import { NotificationsService, SOCKET_FACTORY } from "./notifications.service";
import { ToastService } from "./toast";

describe("NotificationsService", () => {
	let service: NotificationsService;
	const mockToastService = {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
	};

	const mockOn = vi.fn();
	const mockDisconnect = vi.fn();
	const mockSocketInstance = { on: mockOn, disconnect: mockDisconnect };
	const mockSocketFactory = vi.fn(() => mockSocketInstance);

	beforeEach(() => {
		vi.clearAllMocks();
		TestBed.configureTestingModule({
			providers: [
				provideTranslocoTesting(),
				NotificationsService,
				{ provide: ToastService, useValue: mockToastService },
				{ provide: SOCKET_FACTORY, useValue: mockSocketFactory },
			],
		});
		service = TestBed.inject(NotificationsService);
	});

	it("should connect to websocket when connect is called", () => {
		service.connect("mock-token", "user-1");

		expect(mockSocketFactory).toHaveBeenCalledWith(
			expect.stringContaining("/notifications"),
			expect.objectContaining({ auth: { token: "mock-token" } }),
		);
	});

	it("should not reconnect if already connected", () => {
		service.connect("token-1", "user-1");
		service.connect("token-2", "user-1");

		expect(mockSocketFactory).toHaveBeenCalledTimes(1);
	});

	it("should disconnect socket when disconnect is called", () => {
		service.connect("mock-token", "user-1");
		service.disconnect();

		expect(mockDisconnect).toHaveBeenCalled();
	});

	it("should show info toast when event.created is from another user", () => {
		service.connect("mock-token", "user-1");

		const call = mockOn.mock.calls.find((args) => args[0] === "event.created");
		const eventHandler = call?.[1] as (payload: {
			eventId: string;
			title: string;
			createdBy: string;
		}) => void;
		eventHandler?.({
			eventId: "evt-1",
			title: "Catan Night",
			createdBy: "user-2",
		});

		expect(mockToastService.info).toHaveBeenCalledWith(
			"New event: Catan Night",
		);
	});

	it("should NOT show toast when event.created is from the current user", () => {
		service.connect("mock-token", "user-1");

		const call = mockOn.mock.calls.find((args) => args[0] === "event.created");
		const eventHandler = call?.[1] as (payload: {
			eventId: string;
			title: string;
			createdBy: string;
		}) => void;
		eventHandler?.({
			eventId: "evt-1",
			title: "My Own Event",
			createdBy: "user-1",
		});

		expect(mockToastService.info).not.toHaveBeenCalled();
	});
});
