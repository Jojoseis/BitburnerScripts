import { establishControl } from "./EstablishControl.ts";

export function main(ns: NS) {
	const targetedServers: Array<string> = [];

	recursiveScanAndControl(ns, undefined, targetedServers);
}

function recursiveScanAndControl(ns: NS, server: string | undefined, targetedServers: Array<string>) {
	for (const connectedServer of ns.scan(server)) {
		if (targetedServers.includes(connectedServer)) {
			continue;
		}

		targetedServers.push(connectedServer);

		const serverInfo = ns.getServer(connectedServer);
		if (serverInfo.purchasedByPlayer) {
			continue;
		}

		let rootAccess = serverInfo.hasAdminRights;

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
			const availableServerRam = serverInfo.maxRam - ns.getServerUsedRam(connectedServer);
			ns.exec("BaseHack.ts", connectedServer, { threads: Math.floor(availableServerRam / hackRamUsage) }, connectedServer);

			recursiveScanAndControl(ns, connectedServer, targetedServers);
		}
	}
}
