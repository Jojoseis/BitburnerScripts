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
			ns.printf("Current security level of %s is above min %s. Weakening...", currentSecurity, minSecurity);
			await ns.weaken(targetServer);
		} else if (currentMoney < maxMoney) {
			ns.printf("Current money level of %s is below max %s. Growing...", ns.format.number(currentMoney), ns.format.number(maxMoney));
			await ns.grow(targetServer);
		} else {
			ns.printf("Current money level of %s is at max. Hacking...", ns.format.number(currentMoney));
			await ns.hack(targetServer);
		}
	}
}
