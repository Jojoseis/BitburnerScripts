export function getCloudServerData(ns: NS) {
	return ns.cloud.getServerNames().map((serverName) => ns.getServer(serverName));
}
