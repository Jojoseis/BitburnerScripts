import FilePaths from "./utils/FilePaths";

const SLEEP_DELAY = 10000;

enum ScriptSpecialConfig {
	RUN_ONCE,
}

const scripts: Record<string, Array<string>> = {
	[FilePaths.HOME_ENABLEMENT]: [],
	[FilePaths.WORM]: [],
	[FilePaths.CONTRACT_HANDLER]: [],
	[FilePaths.BUY_SERVERS]: [FilePaths.UPGRADE_SERVERS],
	[FilePaths.STOCK_MARKET_STARTER]: [FilePaths.STOCK_MARKET_TRADER],
};

const scriptSpecialConfiguration: Record<string, ScriptSpecialConfig> = {
	[FilePaths.HOME_ENABLEMENT]: ScriptSpecialConfig.RUN_ONCE,
	[FilePaths.BUY_SERVERS]: ScriptSpecialConfig.RUN_ONCE,
	[FilePaths.STOCK_MARKET_STARTER]: ScriptSpecialConfig.RUN_ONCE,
};

export async function main(ns: NS) {
	const previouslyRunScripts: Set<string> = new Set();

	while (true) {
		for (const script in scripts) {
			const subScripts = scripts[script];
			if (!canRunScript(ns, script, subScripts)) {
				break;
			}

			if (scriptSpecialConfiguration[script] === ScriptSpecialConfig.RUN_ONCE && previouslyRunScripts.has(script)) {
				continue;
			}

			if (!isScriptRunning(ns, script, subScripts)) {
				ns.run(script);
			}
			previouslyRunScripts.add(script);
		}
		await ns.sleep(SLEEP_DELAY);
	}
}

function canRunScript(ns: NS, script: string, subScripts: Array<string>): boolean {
	const availableRam = ns.getServerMaxRam() - ns.getServerUsedRam();

	const mainScriptRam = ns.getScriptRam(script);
	const subScriptsRam = subScripts.map((subScript) => ns.getScriptRam(subScript)).reduce((a, b) => a + b, 0);

	return availableRam > mainScriptRam + subScriptsRam;
}

function isScriptRunning(ns: NS, script: string, subScripts: Array<string>): boolean {
	const isMainScriptRunning = ns.scriptRunning(script);
	const isSubScriptRunning = subScripts.some((subScript) => ns.scriptRunning(subScript));

	return isMainScriptRunning || isSubScriptRunning;
}
