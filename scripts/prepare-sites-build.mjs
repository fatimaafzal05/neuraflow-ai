import { cp, mkdir, rm } from "node:fs/promises";

// Sites packages a Vinext/OpenNext-style `dist` directory, while TanStack Start
// emits the same deployable worker bundle into `.output`.
await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await cp(".output/public", "dist/public", { recursive: true });
await cp(".output/server", "dist/server", { recursive: true });
await cp(".output/server/index.mjs", "dist/server/index.js");
await mkdir("dist/.openai", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
