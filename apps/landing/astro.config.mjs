// @ts-check
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({
		imageService: "compile",
	}),
	integrations: [tailwind(), react()],
});
