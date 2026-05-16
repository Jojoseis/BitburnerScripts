import { getControlledServerData } from "../contract/ControlledServerData.ts";

export function getMostEfficientTargetServer(ns: NS) {
	const servers = getControlledServerData(ns);

	const outsideServers = servers.filter((server) => !server.purchasedByPlayer);

	const clearNetServers = outsideServers.filter((server) => "minDifficulty" in server && "moneyMax" in server) as Array<Required<Server>>;

	const currentHackingLevel = ns.getHackingLevel();
	const possibleTargets = clearNetServers
		.filter((server) => server.moneyMax > 0)
		.filter((server) => server.requiredHackingSkill <= currentHackingLevel);
	possibleTargets.sort((serverA, serverB) => {
		const efficiencyA = serverA.moneyMax / serverA.minDifficulty ** 2;
		const efficiencyB = serverB.moneyMax / serverB.minDifficulty ** 2;
		return efficiencyB - efficiencyA;
	});

	if (possibleTargets.length === 0) {
		ns.alert("No viable targets hacking targets found.");
		ns.exit();
	}

	return possibleTargets[0];
}
