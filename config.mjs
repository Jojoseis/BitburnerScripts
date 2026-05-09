import { context } from "esbuild";
import { BitburnerPlugin } from "esbuild-bitburner-plugin";

const createContext = async () =>
	await context({
		outbase: "./build",
		outdir: "./build",
		plugins: [
			BitburnerPlugin({
				port: 12525,
				types: "NetscriptDefinitions.d.ts",
				mirror: {
					servers: "home",
				},
				distribute: {
					"servers/home": "home",
				},
				pushOnConnect: true,
			}),
		],
		bundle: false,
		format: "esm",
		platform: "browser",
		logLevel: "debug",
	});

const ctx = await createContext();
ctx.watch();
