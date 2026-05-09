import { getControlledServerData } from "./ControlledServerData.ts";

export function getMostEfficientTargetServer(ns: NS) {
	const servers = getControlledServerData(ns);

	const outsideServers = servers.filter((server) => !server.purchasedByPlayer);

	const clearNetServers = outsideServers.filter((server) => "minDifficulty" in server && "moneyMax" in server) as Array<Required<Server>>;

	const possibleTargets = clearNetServers
		.filter((server) => server.minDifficulty)
		.filter((server) => server.moneyMax)
		.filter((server) => server.moneyMax > 0);
	possibleTargets.sort((serverA, serverB) => {
		const efficiencyA = serverA.moneyMax / serverA.minDifficulty;
		const efficiencyB = serverB.moneyMax / serverB.minDifficulty;
		return efficiencyB - efficiencyA;
	});

	if (possibleTargets.length === 0) {
		ns.alert("No viable targets hacking targets found.");
		ns.exit();
	}

	return possibleTargets[0];
}
