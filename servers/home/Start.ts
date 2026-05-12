const SLEEP_DELAY = 1000;

enum ScriptSpecialConfig {
	RUN_ONCE,
}

const scripts: Record<string, Array<string>> = {
	"HomeEnablement.ts": [],
	"Worm.ts": [],
	"ContractHandler.ts": [],
	"BuyServers.ts": ["UpgradeServers.ts"],
	"StockMarketStarter.ts": ["StockMarketTrader.ts"],
};

const scriptSpecialConfiguration: Record<string, ScriptSpecialConfig> = {
	"HomeEnablement.ts": ScriptSpecialConfig.RUN_ONCE,
	"ContractHandler.ts": ScriptSpecialConfig.RUN_ONCE,
	"BuyServers.ts": ScriptSpecialConfig.RUN_ONCE,
	"StockMarketStarter.ts": ScriptSpecialConfig.RUN_ONCE,
};

const previouslyRunScripts: Set<string> = new Set();

export async function main(ns: NS) {
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
