import { getMostEfficientTargetServer } from "./MostEfficientTargetServer";

export function main(ns: NS) {
	const [overrideRunningScripts] = ns.args;
	const targetServer = getMostEfficientTargetServer(ns);

	ns.alert(
		`Most efficient target server is ${targetServer.hostname} with max money of ${targetServer.moneyMax.toExponential()} & min difficulty of ${targetServer.minDifficulty}. Starting BaseHack on all cloud servers...`,
	);

	for (const cloudServer of ns.cloud.getServerNames()) {
		if (overrideRunningScripts === "true") {
			ns.killall(cloudServer);
		}
		ns.scp("BaseHack.ts", cloudServer, "home");
		const hackRamUsage = ns.getScriptRam("BaseHack.ts", cloudServer);
		const availableServerRam = ns.getServerMaxRam(cloudServer) - ns.getServerUsedRam(cloudServer);
		const threadCount = Math.floor(availableServerRam / hackRamUsage);
		if (threadCount > 0) {
			ns.exec("BaseHack.ts", cloudServer, { threads: threadCount }, targetServer.hostname);
		}
	}
}
