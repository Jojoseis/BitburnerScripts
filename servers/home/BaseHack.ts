export async function main(ns: NS) {
	const [targetServer] = ns.args;

	if (!targetServer || typeof targetServer !== "string") {
		ns.tprint("Please provide a target server as an argument.");
		return;
	}

	const minSecurity = ns.getServerMinSecurityLevel(targetServer);
	const maxMoney = ns.getServerMaxMoney(targetServer);

	while (true) {
		const currentSecurity = ns.getServerSecurityLevel(targetServer);
		const currentMoney = ns.getServerMoneyAvailable(targetServer);
		if (currentSecurity > minSecurity) {
			console.log("Current security level of %s is above min %s. Weakening...", currentSecurity, minSecurity);
			await ns.weaken(targetServer);
		} else if (currentMoney < maxMoney) {
			console.log("Current money level of %s is below max %s. Growing...", currentMoney, maxMoney);
			await ns.grow(targetServer);
		} else {
			console.log("Current money level of %s is at max. Hacking...", currentMoney);
			await ns.hack(targetServer);
		}
	}
}
