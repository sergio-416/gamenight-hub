import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PLACEHOLDER = '__JAWG_ACCESS_TOKEN__';
const token = process.env.JAWG_ACCESS_TOKEN;

if (!token) {
	console.error('ERROR: JAWG_ACCESS_TOKEN environment variable is not set.');
	process.exit(1);
}

const envDir = resolve(import.meta.dirname, '../src/environments');
const files = ['environment.ts', 'environment.prod.ts'];

for (const file of files) {
	const filePath = resolve(envDir, file);
	const content = readFileSync(filePath, 'utf-8');
	writeFileSync(filePath, content.replaceAll(PLACEHOLDER, token));
	console.log(`Injected JAWG_ACCESS_TOKEN into ${file}`);
}
