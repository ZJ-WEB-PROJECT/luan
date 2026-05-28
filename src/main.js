import { createSSRApp } from "vue";
import uviewPlus from "uview-plus";
import App from "./App.vue";
import http from "@/common/request";
// #ifdef H5
import { ensureAmapSecurityConfig } from "@/common/amap";
ensureAmapSecurityConfig();
// #endif

export function createApp() {
	const app = createSSRApp(App);
	app.use(uviewPlus);
	app.config.globalProperties.$http = http;
	return {
		app,
	};
}
