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
				pushOnConnect: true,
				distribute: {
					"servers/home": ["home"]
				}
			}),
		],
		bundle: false,
		format: "esm",
		platform: "node",
		logLevel: "debug",
	});

const ctx = await createContext();
ctx.watch();
