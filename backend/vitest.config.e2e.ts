import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  oxc: false,
  test: {
    globals: true,
    root: "./",
    environment: "node",
    include: ["test/**/*.e2e-spec.ts"],
    globalSetup: ["./test/setup/global-setup.ts"],
  },
  plugins: [
    swc.vite({
      module: { type: "es6" },
    }),
  ],
});
