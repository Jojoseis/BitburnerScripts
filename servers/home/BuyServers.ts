export async function main(ns: NS) {
	const SLEEP_TIME = 100;
	const defaultServerName = "cloud-server";
	const cloud = ns.cloud;

	let serverNames: Array<string> = [];

	// biome-ignore lint/suspicious/noAssignInExpressions: RAM optimization to avoid re-calling cloud.getServerNames()
	while ((serverNames = cloud.getServerNames()).length < cloud.getServerLimit()) {
		const ram = 8;
		const serverCost = cloud.getServerCost(ram);
		if (ns.getServerMoneyAvailable("home") >= serverCost) {
			const newServerName = `${defaultServerName}-${serverNames.length + 1}`;
			cloud.purchaseServer(newServerName, ram);
		} else {
			await ns.sleep(SLEEP_TIME);
		}
	}

	ns.alert("All cloud servers purchased!");
}
