// @ts-check

import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	// Needed for absolute canonical, og:url and og:image URLs.
	site: "https://cosmq.arielton.com",
	adapter: cloudflare({
		imageService: "compile",
	}),
	integrations: [tailwind(), react()],
});
