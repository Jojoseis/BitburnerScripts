import { establishControl } from "./EstablishControl.ts";

export function main(ns: NS) {
	const targetedServers: Array<string> = [];

	recursiveScanAndControl(ns, "home", targetedServers);
}

function recursiveScanAndControl(ns: NS, server: string, targetedServers: Array<string>) {
	targetedServers.push(server);

	for (const connectedServer of ns.scan(server)) {
		if (targetedServers.includes(connectedServer)) {
			continue;
		}

		let rootAccess = ns.hasRootAccess(connectedServer);

		if (!rootAccess) {
			rootAccess = establishControl(ns, connectedServer);
			if (rootAccess) {
				ns.tprintf("Control established on %s", connectedServer);
			}
		}

		if (rootAccess) {
			ns.scp("BaseHack.ts", connectedServer, "home");
			ns.scriptKill("BaseHack.ts", connectedServer);

			const hackRamUsage = ns.getScriptRam("BaseHack.ts", connectedServer);
			const availableServerRam = ns.getServerMaxRam(connectedServer) - ns.getServerUsedRam(connectedServer);
			ns.exec("BaseHack.ts", connectedServer, { threads: Math.floor(availableServerRam / hackRamUsage) }, connectedServer);

			recursiveScanAndControl(ns, connectedServer, targetedServers);
		}
	}
}
