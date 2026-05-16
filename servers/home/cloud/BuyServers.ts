export const BUY_SLEEP_TIME = 100;
const DEFAULT_SERVER_NAME = "cloud-server";
const FUND_BUFFER_MULTIPLIER = 1;

export async function main(ns: NS) {
	ns.run("cloud/OptimizeCloudUsage.ts");

	const cloud = ns.cloud;

	let serverNames: Array<string> = [];
	// biome-ignore lint/suspicious/noAssignInExpressions: RAM optimization to avoid re-calling cloud.getServerNames()
	while ((serverNames = cloud.getServerNames()).length < cloud.getServerLimit()) {
		const ram = 8;
		const serverCost = cloud.getServerCost(ram);
		if (ns.getServerMoneyAvailable("home") >= serverCost * (FUND_BUFFER_MULTIPLIER + 1)) {
			const newServerName = `${DEFAULT_SERVER_NAME}-${serverNames.length + 1}`;
			cloud.purchaseServer(newServerName, ram);
			ns.run("cloud/OptimizeCloudUsage.ts");
		} else {
			await ns.sleep(BUY_SLEEP_TIME);
		}
	}

	ns.alert("All cloud servers purchased! Upgrading servers next.");
	ns.spawn("cloud/UpgradeServers.ts", { spawnDelay: 0 });
}
