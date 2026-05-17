import type {
	CodingContractObject as _CodingContractObject,
	CodingContractSignatures as _CodingContractSignatures,
	Darknet as _Darknet,
	NS as _NS,
	Server as _Server,
	Stock as _Stock,
} from "NetscriptDefinitions";

declare global {
	type CodingContractObject = _CodingContractObject;
	type CodingContractSignatures = _CodingContractSignatures;
	type Darknet = _Darknet;
	type NS = _NS;
	type Server = _Server;
	type Stock = _Stock;
}
