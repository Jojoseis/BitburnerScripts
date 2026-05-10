export async function main(ns: NS) {
	const [targetServer] = ns.args;

	if (!targetServer || typeof targetServer !== "string") {
		ns.tprint("Please provide a target server as an argument.");
		return;
	}

	ns.scp("ShareRAM.ts", targetServer, "home");
	const hackRamUsage = ns.getScriptRam("ShareRAM.ts", targetServer);
	const availableServerRam = ns.getServerMaxRam(targetServer) - ns.getServerUsedRam(targetServer);
	const threadCount = Math.floor(availableServerRam / hackRamUsage);
	if (threadCount > 0) {
		ns.exec("ShareRAM.ts", targetServer, { threads: threadCount });
	}
}
