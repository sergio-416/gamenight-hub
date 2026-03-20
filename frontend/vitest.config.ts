/// <reference types="vitest/globals" />

import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [angular(), tsconfigPaths()],

	test: {
		environment: 'happy-dom',
		include: ['src/**/*.spec.ts'],
		globals: true,
		setupFiles: ['src/test-setup.ts'],
		pool: 'forks',
		browser: {
			enabled: false,
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			reportsDirectory: './coverage',
			include: ['src/**/*.ts'],
			exclude: [
				'src/**/*.spec.ts',
				'src/**/test-setup.ts',
				'src/**/main.ts',
				'src/**/app.config.ts',
			],
		},
	},
});
