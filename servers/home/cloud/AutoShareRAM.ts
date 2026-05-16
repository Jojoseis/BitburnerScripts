import FilePaths from "../utils/FilePaths";

export async function main(ns: NS) {
	const [targetServer] = ns.args;

	if (!targetServer || typeof targetServer !== "string") {
		ns.tprint("Please provide a target server as an argument.");
		return;
	}

	ns.scp(FilePaths.SHARE_RAM, targetServer, "home");
	const hackRamUsage = ns.getScriptRam(FilePaths.SHARE_RAM, targetServer);
	const availableServerRam = ns.getServerMaxRam(targetServer) - ns.getServerUsedRam(targetServer);
	const threadCount = Math.floor(availableServerRam / hackRamUsage);
	if (threadCount > 0) {
		ns.exec(FilePaths.SHARE_RAM, targetServer, { threads: threadCount });
	}
}
