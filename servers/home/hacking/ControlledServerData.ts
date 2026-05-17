export type ServerData = Record<string, ServerDetails>;

type ServerDetails =
	| Server
	| (Server & {
			isOnline: boolean;
	  } & ReturnType<Darknet["getServerDetails"]>);

export function getControlledServerData(ns: NS) {
	const targetedServers: ServerData = {};

	recursiveScan(ns, "home", targetedServers);

	return Object.values(targetedServers);
}

function recursiveScan(ns: NS, server: string, targetedServers: ServerData) {
	let serverData: ServerDetails = ns.getServer(server);

	if ("isOnline" in serverData) {
		serverData = {
			...serverData,
			...ns.dnet.getServerDetails(server),
		};
	}

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
