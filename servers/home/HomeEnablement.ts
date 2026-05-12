const SLEEP_DELAY = 1000;
const TARGET_RAM_IN_GB = 1000;
const TARGET_CORES = 4;

export async function main(ns: NS) {
	while (true) {
		/**
		if (!ns.hasTorRouter()) {
			ns.singularity.purchaseTor();
		}

		if (ns.getServerMaxRam("home") < TARGET_RAM_IN_GB) {
			if (getMoney(ns) > ns.singularity.getUpgradeHomeRamCost()) {
				ns.singularity.upgradeHomeRam();
			}
		}

		// TODO upgrade home cores
		*/

		await ns.sleep(SLEEP_DELAY);
	}
}

function getMoney(ns: NS) {
	return ns.getServerMoneyAvailable("home");
}
