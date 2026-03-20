import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast';

describe('ToastService', () => {
	let service: ToastService;
	const mockLiveAnnouncer = { announce: vi.fn().mockResolvedValue(undefined) };

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [ToastService, { provide: LiveAnnouncer, useValue: mockLiveAnnouncer }],
		});
		service = TestBed.inject(ToastService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('showing toasts', () => {
		it('should add a toast to the toasts signal when show is called', () => {
			expect(service.toasts().length).toBe(0);

			service.show('Test message', 'info', 0);

			expect(service.toasts().length).toBe(1);
			expect(service.toasts()[0].message).toBe('Test message');
			expect(service.toasts()[0].type).toBe('info');
		});

		it('should add multiple toasts when show is called multiple times', () => {
			service.show('First message', 'success', 0);
			service.show('Second message', 'error', 0);
			service.show('Third message', 'warning', 0);

			expect(service.toasts().length).toBe(3);
		});

		it('should generate unique IDs for each toast', () => {
			service.show('Message 1', 'info', 0);
			service.show('Message 2', 'info', 0);

			const toasts = service.toasts();
			expect(toasts[0].id).not.toBe(toasts[1].id);
		});
	});

	describe('toast type shortcuts', () => {
		it('should show success toast when success method is called', () => {
			service.success('Success message');

			const toast = service.toasts()[0];
			expect(toast.type).toBe('success');
			expect(toast.message).toBe('Success message');
			expect(toast.duration).toBe(3000);
		});

		it('should show error toast when error method is called', () => {
			service.error('Error message');

			const toast = service.toasts()[0];
			expect(toast.type).toBe('error');
			expect(toast.message).toBe('Error message');
			expect(toast.duration).toBe(5000);
		});

		it('should show info toast when info method is called', () => {
			service.info('Info message');

			const toast = service.toasts()[0];
			expect(toast.type).toBe('info');
			expect(toast.message).toBe('Info message');
			expect(toast.duration).toBe(3000);
		});

		it('should show warning toast when warning method is called', () => {
			service.warning('Warning message');

			const toast = service.toasts()[0];
			expect(toast.type).toBe('warning');
			expect(toast.message).toBe('Warning message');
			expect(toast.duration).toBe(4000);
		});
	});

	describe('screen reader announcements', () => {
		it('should announce toast message with polite politeness for info toasts', () => {
			service.show('Info message', 'info', 0);
			expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Info message', 'polite');
		});

		it('should announce toast message with assertive politeness for error toasts', () => {
			service.show('Error message', 'error', 0);
			expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Error message', 'assertive');
		});

		it('should announce toast message with polite politeness for success toasts', () => {
			service.success('Success message');
			expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Success message', 'polite');
		});
	});

	describe('dismissing toasts', () => {
		it('should remove a toast when dismiss is called with its ID', () => {
			service.show('Message 1', 'info', 0);
			service.show('Message 2', 'success', 0);

			expect(service.toasts().length).toBe(2);

			const firstToastId = service.toasts()[0].id;
			service.dismiss(firstToastId);

			expect(service.toasts().length).toBe(1);
			expect(service.toasts()[0].message).toBe('Message 2');
		});

		it('should not affect other toasts when dismissing a specific toast', () => {
			service.show('Keep this', 'info', 0);
			service.show('Remove this', 'error', 0);
			service.show('Keep this too', 'success', 0);

			const middleToastId = service.toasts()[1].id;
			service.dismiss(middleToastId);

			expect(service.toasts().length).toBe(2);
			expect(service.toasts()[0].message).toBe('Keep this');
			expect(service.toasts()[1].message).toBe('Keep this too');
		});

		it('should handle dismissing a non-existent toast ID gracefully', () => {
			service.show('Test message', 'info', 0);

			expect(() => service.dismiss('non-existent-id')).not.toThrow();
			expect(service.toasts().length).toBe(1);
		});
	});

	describe('auto-dismiss behavior', () => {
		it('should automatically dismiss toast after specified duration', async () => {
			vi.useFakeTimers();

			service.show('Auto-dismiss message', 'info', 1000);

			expect(service.toasts().length).toBe(1);

			vi.advanceTimersByTime(1000);

			expect(service.toasts().length).toBe(0);

			vi.useRealTimers();
		});

		it('should not auto-dismiss toast when duration is 0', async () => {
			vi.useFakeTimers();

			service.show('Persistent message', 'info', 0);

			expect(service.toasts().length).toBe(1);

			vi.advanceTimersByTime(10000);

			expect(service.toasts().length).toBe(1);

			vi.useRealTimers();
		});

		it('should handle multiple toasts with different durations', async () => {
			vi.useFakeTimers();

			service.show('Short message', 'info', 1000);
			service.show('Long message', 'success', 3000);
			service.show('Persistent', 'warning', 0);

			expect(service.toasts().length).toBe(3);

			vi.advanceTimersByTime(1000);
			expect(service.toasts().length).toBe(2);
			expect(service.toasts().find((t) => t.message === 'Short message')).toBeUndefined();

			vi.advanceTimersByTime(2000);
			expect(service.toasts().length).toBe(1);
			expect(service.toasts()[0].message).toBe('Persistent');

			vi.useRealTimers();
		});
	});
});
