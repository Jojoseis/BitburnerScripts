export async function main(ns: NS) {
	const worm = new DarkNetWorm(ns);
	await worm.run();
}

class DarkNetWorm {
	static readonly #serverAuthMap: Record<string, string> = {};

	readonly #ns: NS;
	readonly #dnet: Darknet;

	public constructor(ns: NS) {
		this.#ns = ns;
		this.#dnet = ns.dnet;
	}

	public async run() {
		for (const host of this.#dnet.probe()) {
			const server = this.#getServer(host);

			if (!server.isOnline) {
				continue;
			}

			if (!(host in DarkNetWorm.#serverAuthMap)) {
				server.passwordFormat; // TODO
			}
			await this.#replicateOnto(host);
		}
	}

	#getServer(host: string) {
		return this.#ns.dnet.getServerDetails(host);
	}

	async #replicateOnto(host: string) {
		const password = DarkNetWorm.#serverAuthMap[host];
		const authResult = await this.#dnet.authenticate(host, password);

		if (authResult.success) {
			this.#ns.scp("darknet/DarkNetWorm.ts", host);
			this.#ns.exec("darknet/DarkNetWorm.ts", host);
		} else {
			this.#ns.alert(`Failed to authenticate on known darknet server ${host} with password ${password}`);
		}
	}
}
