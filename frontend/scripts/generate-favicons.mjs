import favicons from "favicons";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.resolve(__dirname, "../public/GNH-isotype-header.png");
const outputDir = path.resolve(__dirname, "../public");

const configuration = {
	path: "/",
	appName: "GameNight Hub",
	appShortName: "GNH",
	appDescription: "Your Game Night Companion",
	background: "hsl(0, 0%, 100%)",
	theme_color: "hsl(160 84% 39%)",
	display: "standalone",
	orientation: "portrait",
	scope: "/",
	start_url: "/",
	manifestMaskable: source,
	icons: {
		android: true,
		appleIcon: true,
		appleStartup: false,
		favicons: true,
		windows: false,
		yandex: false,
	},
};

try {
	const response = await favicons(source, configuration);

	response.images.forEach((image) => {
		fs.writeFileSync(path.join(outputDir, image.name), image.contents);
	});
	response.files
		.filter((file) => file.name !== "manifest.webmanifest")
		.forEach((file) => {
			fs.writeFileSync(path.join(outputDir, file.name), file.contents);
		});

	console.log("✅ Favicons generated successfully!");
	console.log("\nAdd these lines to your src/index.html <head>:");
	console.log(response.html.join("\n"));
} catch (error) {
	console.error("❌ Error generating favicons:", error);
}
