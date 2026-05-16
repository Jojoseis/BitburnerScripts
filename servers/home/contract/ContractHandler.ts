import ContractSolver, { type ContractData, type ContractSolution, UnimplementedSolutionError } from "./ContractSolver";
import { getControlledServerData } from "./ControlledServerData";

export type CodingContract<TYPE extends keyof CodingContractSignatures = keyof CodingContractSignatures> = {
	type: TYPE;
	data: ContractData<TYPE>;
	submit(answer: ContractSolution<TYPE>): string;
	description: string;
	difficulty: number;
	numTriesRemaining(): number;
};

const CONTRACT_SOLVER = new ContractSolver();

export async function main(ns: NS) {
	const contract = findContract(ns);
	if (contract) {
		try {
			const startTimeStamp = Date.now();
			const reward = solveContract(contract);

			ns.tprint(`Solved contract after ${Date.now() - startTimeStamp}ms. Reward: ${reward}`);
		} catch (error) {
			if (error instanceof ContractHandlerError) {
				const message = (error as Error).message;
				ns.tprint(message);
				ns.alert(message);
				ns.exit();
			} else {
				throw error;
			}
		}
	}
}

function findContract(ns: NS): CodingContractObject | undefined {
	const servers = getControlledServerData(ns);

	for (const server of servers) {
		const contracts = ns.ls(server.hostname, ".cct");
		if (contracts.length > 0) {
			const contract = ns.codingcontract.getContract(contracts[0], server.hostname);
			ns.tprint(`Found contract on ${server.hostname}: ${contract.type}.`);
			return contract;
		}
	}
}

function solveContract(contract: CodingContractObject) {
	try {
		const typedContract = contract as CodingContract<typeof contract.type>;

		// @ts-expect-error - was not able to enable propert typegating for contract.type
		const solution = CONTRACT_SOLVER[typedContract.type](typedContract.data);

		const reward = typedContract.submit(solution);

		if (reward === "") {
			throw new ContractHandlerError(contract, `Submitted solution: ${JSON.stringify(solution)}. Tries left: ${contract.numTriesRemaining()}`);
		}

		return reward;
	} catch (error) {
		if (error instanceof UnimplementedSolutionError) {
			throw new ContractHandlerError(contract, `No solution implemented for contract type.`);
		} else {
			throw error;
		}
	}
}

class ContractHandlerError extends Error {
	readonly #contract: CodingContractObject;
	readonly #additionalInfo: string;

	public constructor(contract: CodingContractObject, additionalInfo: string) {
		super(
			`Failed to solve contract '${contract.type}' with description '${contract.description}' and data: ${JSON.stringify(contract.data)}.\n${additionalInfo}`,
		);
		this.#contract = contract;
		this.#additionalInfo = additionalInfo;
	}

	public getContract() {
		return this.#contract;
	}

	public getAdditionalInfo() {
		return this.#additionalInfo;
	}
}
