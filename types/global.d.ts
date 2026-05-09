import type { DarknetServerData as _DarknetServerData, NS as _NS, Server as _Server } from "NetscriptDefinitions";

declare global {
	type DarknetServerData = _DarknetServerData;
	type NS = _NS;
	type Server = _Server;
}
