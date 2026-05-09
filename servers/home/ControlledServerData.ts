export type ServerData = Record<
	string,
	| Server
	| (DarknetServerData & {
			isOnline: boolean;
	  })
>;

export function getControlledServerData(ns: NS) {
	const targetedServers: ServerData = {};

	recursiveScan(ns, "home", targetedServers);

	return Object.values(targetedServers);
}

function recursiveScan(ns: NS, server: string, targetedServers: ServerData) {
	targetedServers[server] = ns.getServer(server);

	for (const connectedServer of ns.scan(server)) {
		if (connectedServer in targetedServers) {
			continue;
		}

		const rootAccess = ns.hasRootAccess(connectedServer);

		if (rootAccess) {
			recursiveScan(ns, connectedServer, targetedServers);
		}
	}
}
