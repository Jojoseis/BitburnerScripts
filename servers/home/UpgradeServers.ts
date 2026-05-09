import { BUY_SLEEP_TIME } from "./BuyServers";
import { getCloudServerData } from "./CloudServerData";

const MAX_RAM = 1048576; // 2 ^ 20

export async function main(ns: NS) {
	while (true) {
		const cloudServers = getCloudServerData(ns);

		if (cloudServers.length === 0) {
			ns.alert("No cloud servers found. Buying servers first.");
			ns.spawn("BuyServers.ts", { spawnDelay: 0 });
		}

		const cloudServersSortedByRam = cloudServers.sort((serverA, serverB) => serverA.maxRam - serverB.maxRam);
		const lowestRamServer = cloudServersSortedByRam[0];

		if (lowestRamServer.maxRam >= MAX_RAM) {
			ns.alert("All cloud servers upgraded to max RAM!");
			break;
		}

		const newRam = lowestRamServer.maxRam * 2;
		const upgradeCost = ns.cloud.getServerUpgradeCost(lowestRamServer.hostname, newRam);
		if (ns.getServerMoneyAvailable("home") >= upgradeCost * 2) {
			// Keep a buffer of funds
			ns.cloud.upgradeServer(lowestRamServer.hostname, newRam);
			ns.run("OptimizeCloudUsage.ts");
		} else {
			await ns.sleep(BUY_SLEEP_TIME);
		}
	}
}
