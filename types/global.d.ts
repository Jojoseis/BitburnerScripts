import type {
	CodingContractObject as _CodingContractObject,
	CodingContractSignatures as _CodingContractSignatures,
	DarknetServerData as _DarknetServerData,
	NS as _NS,
	Server as _Server,
} from "NetscriptDefinitions";

declare global {
	type CodingContractObject = _CodingContractObject;
	type CodingContractSignatures = _CodingContractSignatures;
	type DarknetServerData = _DarknetServerData;
	type NS = _NS;
	type Server = _Server;
}
