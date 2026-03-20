import { provideRouter } from '@angular/router';
import { OrganiserService } from '@core/services/organiser.service';
import { provideTranslocoTesting } from '@core/testing/transloco-testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RegisterOrganiser } from './register-organiser';

describe('RegisterOrganiser', () => {
	const mockSubmitRequest = vi.fn().mockResolvedValue(undefined);

	const mockOrganiserService = {
		submitRequest: mockSubmitRequest,
	};

	beforeEach(() => {
		mockSubmitRequest.mockClear();
	});

	it('should display organisation registration form', async () => {
		await render(RegisterOrganiser, {
			providers: [
				provideRouter([]),
				provideTranslocoTesting(),
				{ provide: OrganiserService, useValue: mockOrganiserService },
			],
		});

		expect(screen.getByLabelText(/organisation name/i)).toBeTruthy();
		expect(screen.getByLabelText(/address/i)).toBeTruthy();
		expect(screen.getByLabelText(/your email/i)).toBeTruthy();
	});

	it('should show validation error for short organisation name', async () => {
		await render(RegisterOrganiser, {
			providers: [
				provideRouter([]),
				provideTranslocoTesting(),
				{ provide: OrganiserService, useValue: mockOrganiserService },
			],
		});

		await userEvent.type(screen.getByLabelText(/organisation name/i), 'A');
		await userEvent.click(screen.getByRole('button', { name: /submit application/i }));

		expect(screen.getByText(/organisation name must be at least 2 characters/i)).toBeTruthy();
	});

	it('should show validation error for invalid email', async () => {
		await render(RegisterOrganiser, {
			providers: [
				provideRouter([]),
				provideTranslocoTesting(),
				{ provide: OrganiserService, useValue: mockOrganiserService },
			],
		});

		await userEvent.type(screen.getByLabelText(/organisation name/i), 'Test Org');
		await userEvent.type(screen.getByLabelText(/address/i), '123 Test St');
		await userEvent.type(screen.getByLabelText(/your email/i), 'not-an-email');
		await userEvent.click(screen.getByRole('button', { name: /submit application/i }));

		expect(screen.getByText(/please enter a valid email/i)).toBeTruthy();
	});

	it('should submit request successfully with valid data', async () => {
		await render(RegisterOrganiser, {
			providers: [
				provideRouter([]),
				provideTranslocoTesting(),
				{ provide: OrganiserService, useValue: mockOrganiserService },
			],
		});

		await userEvent.type(screen.getByLabelText(/organisation name/i), 'Test Org');
		await userEvent.type(screen.getByLabelText(/address/i), '123 Test St');
		await userEvent.type(screen.getByLabelText(/your email/i), 'test@example.com');

		await userEvent.click(screen.getByRole('button', { name: /submit application/i }));

		await waitFor(() => {
			expect(mockSubmitRequest).toHaveBeenCalledWith({
				orgName: 'Test Org',
				address: '123 Test St',
				email: 'test@example.com',
			});
		});
	});

	it('should show success modal after successful submission', async () => {
		await render(RegisterOrganiser, {
			providers: [
				provideRouter([]),
				provideTranslocoTesting(),
				{ provide: OrganiserService, useValue: mockOrganiserService },
			],
		});

		await userEvent.type(screen.getByLabelText(/organisation name/i), 'Test Org');
		await userEvent.type(screen.getByLabelText(/address/i), '123 Test St');
		await userEvent.type(screen.getByLabelText(/your email/i), 'test@example.com');

		await userEvent.click(screen.getByRole('button', { name: /submit application/i }));

		await waitFor(() => {
			expect(screen.getByText(/application received!/i)).toBeTruthy();
		});
	});

	it('should show error message on submission failure', async () => {
		mockSubmitRequest.mockRejectedValue(new Error('Firebase error'));

		await render(RegisterOrganiser, {
			providers: [
				provideRouter([]),
				provideTranslocoTesting(),
				{ provide: OrganiserService, useValue: mockOrganiserService },
			],
		});

		await userEvent.type(screen.getByLabelText(/organisation name/i), 'Test Org');
		await userEvent.type(screen.getByLabelText(/address/i), '123 Test St');
		await userEvent.type(screen.getByLabelText(/your email/i), 'test@example.com');

		await userEvent.click(screen.getByRole('button', { name: /submit application/i }));

		await waitFor(() => {
			expect(screen.getByText(/something went wrong/i)).toBeTruthy();
		});
	});

	it('should display pending approval notice', async () => {
		await render(RegisterOrganiser, {
			providers: [
				provideRouter([]),
				provideTranslocoTesting(),
				{ provide: OrganiserService, useValue: mockOrganiserService },
			],
		});

		expect(screen.getByText(/application will be reviewed/i)).toBeTruthy();
	});
});
