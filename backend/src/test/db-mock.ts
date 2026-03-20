import { vi } from 'vitest';

type ResolvedValues = {
	select?: unknown;
	insert?: unknown;
	update?: unknown;
	delete?: unknown;
};

function createChainProxy(resolvedValue: unknown): unknown {
	return new Proxy(() => {}, {
		get(_target, prop) {
			if (prop === 'then') {
				return (resolve: (v: unknown) => void) => resolve(resolvedValue);
			}
			return createChainProxy(resolvedValue);
		},
		apply() {
			return createChainProxy(resolvedValue);
		},
	});
}

export function buildMockDb(values: ResolvedValues = {}) {
	return {
		select: vi.fn(() => createChainProxy(values.select ?? [])),
		insert: vi.fn(() => createChainProxy(values.insert ?? [])),
		update: vi.fn(() => createChainProxy(values.update ?? [])),
		delete: vi.fn(() => createChainProxy(values.delete ?? [])),
	};
}

export function chainResolving(value: unknown) {
	return createChainProxy(value);
}
