import { getMostEfficientTargetServer } from "../MostEfficientTargetServer";

export function main(ns: NS) {
	const [overrideRunningScripts] = ns.args;
	const targetServer = getMostEfficientTargetServer(ns);

	ns.printf(
		"Most efficient target server is %s with max money of %s & min difficulty of %s. Starting BaseHack on all cloud servers...",
		targetServer.hostname,
		ns.format.number(targetServer.moneyMax),
		targetServer.minDifficulty,
	);

	for (const cloudServer of ns.cloud.getServerNames()) {
		if (overrideRunningScripts === "true") {
			ns.killall(cloudServer);
		}

		if (
			cloudServer.endsWith("-21") ||
			cloudServer.endsWith("-22") ||
			cloudServer.endsWith("-23") ||
			cloudServer.endsWith("-24") ||
			cloudServer.endsWith("-25")
		) {
			ns.exec("AutoShareRAM.ts", "home", 1, cloudServer);
		} else {
			ns.scp("BaseHack.ts", cloudServer, "home");
			const hackRamUsage = ns.getScriptRam("BaseHack.ts", cloudServer);
			const availableServerRam = ns.getServerMaxRam(cloudServer) - ns.getServerUsedRam(cloudServer);
			const threadCount = Math.floor(availableServerRam / hackRamUsage);
			if (threadCount > 0) {
				ns.exec("BaseHack.ts", cloudServer, { threads: threadCount }, targetServer.hostname);
			}
		}
	}
}
