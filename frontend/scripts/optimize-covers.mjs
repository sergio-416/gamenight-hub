import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.resolve(
	__dirname,
	'../src/app/features/create-event/assets',
);

const pngFiles = fs
	.readdirSync(assetsDir)
	.filter((file) => file.endsWith('.png'));

if (pngFiles.length === 0) {
	console.log('No .png files found — nothing to optimise.');
	process.exit(0);
}

console.log(`Found ${pngFiles.length} PNG file(s). Converting to WebP…\n`);

for (const file of pngFiles) {
	const inputPath = path.join(assetsDir, file);
	const outputPath = path.join(
		assetsDir,
		`${path.basename(file, '.png')}.webp`,
	);

	try {
		await sharp(inputPath).resize({ width: 800 }).webp({ quality: 80 }).toFile(outputPath);

		fs.unlinkSync(inputPath);
		console.log(`✔ ${file} → ${path.basename(outputPath)}`);
	} catch (error) {
		console.error(`✖ Failed to convert ${file}:`, error.message);
	}
}

console.log('\nDone.');
