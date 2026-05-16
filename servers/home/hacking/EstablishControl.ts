export function main(ns: NS) {
	const [targetServer] = ns.args;

	if (!targetServer || typeof targetServer !== "string") {
		ns.tprint("Please provide a target server as an argument.");
		return;
	}

	return establishControl(ns, targetServer);
}

export function establishControl(ns: NS, targetServer: string): boolean {
	if (ns.fileExists("BruteSSH.exe", "home")) {
		ns.brutessh(targetServer);
	}

	if (ns.fileExists("FTPCrack.exe", "home")) {
		ns.ftpcrack(targetServer);
	}

	if (ns.fileExists("relaySMTP.exe", "home")) {
		ns.relaysmtp(targetServer);
	}

	if (ns.fileExists("HTTPWorm.exe")) {
		ns.httpworm(targetServer);
	}

	if (ns.fileExists("SQLInject.exe")) {
		ns.sqlinject(targetServer);
	}

	return ns.nuke(targetServer);
}
