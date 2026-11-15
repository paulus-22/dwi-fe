import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache yet: the dashboard is fully dynamic. The public
// invitation pages will want the R2 cache when they move here.
export default defineCloudflareConfig({});
