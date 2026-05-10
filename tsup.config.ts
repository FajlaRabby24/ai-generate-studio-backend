import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/app.ts",
    server: "src/index.ts",
  },
  format: ["esm"],
  platform: "node",
  target: "node20",
  outDir: "dist",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  shims: true,
  external: ["pg-native", "@prisma/client", ".prisma/client"],
});
