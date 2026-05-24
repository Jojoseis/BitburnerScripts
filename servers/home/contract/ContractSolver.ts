type ContractSolvers = {
	[TYPE in keyof CodingContractSignatures]: ContractSolverFunction<TYPE>;
};

type ContractSolverFunction<TYPE extends keyof CodingContractSignatures> = (data: ContractData<TYPE>) => ContractSolution<TYPE>;

export type ContractData<TYPE extends keyof CodingContractSignatures> = CodingContractSignatures[TYPE][0];

export type ContractSolution<TYPE extends keyof CodingContractSignatures> = CodingContractSignatures[TYPE][1];

export default class ContractSolver implements ContractSolvers {
	public "Find Largest Prime Factor"(data: number): number {
		// Pollard's Rho Algorithm
		if (data <= 1) {
			throw new Error("Input must be greater than 1.");
		}

		let maxPrimeFactor = 2;
		const factors = [data]; // not necessarily prime factors

		while (factors.length > 0) {
			const factor = factors.pop() as number;

			if (factor <= maxPrimeFactor) {
				break; // stop once the remaining factors are smaller then the already determined max prime factor
			}

			const subFactor = this.#findFactor(factor);
			if (subFactor === false) {
				if (factor > maxPrimeFactor) {
					maxPrimeFactor = factor;
				}
			} else {
				if (!factors.includes(subFactor)) {
					factors.push(subFactor);
				}
				if (!factors.includes(factor / subFactor)) {
					factors.push(factor / subFactor);
				}
			}

			factors.sort((a, b) => a - b);
		}

		return maxPrimeFactor;
	}

	#findFactor(n: number, c = 1): number | false {
		let x = 2;

		let y = x;
		let d = 1;

		const g = (x: number) => (x ** 2 + c) % n;

		while (d === 1) {
			x = g(x);
			y = g(g(y));
			d = this.#greatestCommonDivisor(Math.abs(x - y), n);
		}

		const MAX_C = 1000;
		if (d === n) {
			if (c + 1 >= d || c >= MAX_C) {
				return false;
			}
			return this.#findFactor(n, c + 1);
		}

		return d;
	}

	#greatestCommonDivisor(a: number, b: number): number {
		// Euclidean Algorithm
		while (b !== 0) {
			const temp = b;
			b = a % b;
			a = temp;
		}
		return a;
	}

	public "Subarray with Maximum Sum"(data: Array<number>): number {
		// filter 0 values
		const nonZeroData = data.filter((number) => number !== 0);

		const condensedData: Array<number> = [];

		// group adjacent groups of positive or negative numbers to reduce array size
		// [-2, 1, -2, -1 , 3, 2, -1] => [1, -3, 5]
		// a secondary effect is that positive/negative numbers are now always alternating
		let currentGroupSum = 0;
		for (const number of nonZeroData) {
			if (number > 0 && currentGroupSum >= 0) {
				currentGroupSum += number;
			} else if (number < 0 && currentGroupSum <= 0) {
				currentGroupSum += number;
			} else {
				condensedData.push(currentGroupSum);
				currentGroupSum = number;
			}
		}
		// omit adding negative tail
		if (currentGroupSum > 0) {
			condensedData.push(currentGroupSum);
		}
		// remove negative head
		if (condensedData[0] < 0) {
			condensedData.shift();
		}

		// reduce data set further by grouping sections where a, c > |b| for [..., a, b, c, ...] to [..., a + b + c, ...]
		const GROUP_SIZE = 3;
		for (let i = 0; i < condensedData.length - 2; ) {
			const a = condensedData[i];
			// when a > 0, then the following two numbers are negative and positive respectively
			// because positive/negative numbers are alternating (previous step)
			const b = Math.abs(condensedData[i + 1]);
			const c = condensedData[i + 2];
			if (a >= b && c >= b) {
				condensedData.splice(i, GROUP_SIZE, a - b + c);

				if (i > 0) {
					// re-check if merge with previous group is possible
					i = i - 2;
				}
			} else {
				i = i + 2;
			}
		}

		const possibleIndexes = this.#getIndexesOfPositiveNumbers(condensedData);

		// using the largest number as a starting point
		// required because the optimized data set may be empty if all initial data points were < 0
		let maxSubarraySum = Math.max(...data);
		for (const possibleStartIndex of possibleIndexes) {
			for (const possibleEndIndex of possibleIndexes.filter((index) => index >= possibleStartIndex)) {
				const subarraySum = condensedData.slice(possibleStartIndex, possibleEndIndex + 1).reduce((sum, number) => sum + number, 0);
				if (subarraySum > maxSubarraySum) {
					maxSubarraySum = subarraySum;
				}
			}
		}

		return maxSubarraySum;
	}

	#getIndexesOfPositiveNumbers(data: Array<number>): Array<number> {
		const positiveNumberIndexes: Array<number> = [];

		for (let index = 0; index < data.length; index++) {
			if (data[index] > 0) {
				positiveNumberIndexes.push(index);
			}
		}

		return positiveNumberIndexes;
	}

	public "Total Ways to Sum"(data: number): number {
		/**
		 * Idea:
		 * - iterate for each 2 to X
		 * - for every iteration n:
		 *  - a new entry with '<n-1> + 1' is added
		 * 	- every previous sum chain will be kept, with a '+1' added at the end
		 * 	- the last two entries '... + m + n' of a chain determine if they are able to produce more then then their '+1' offspring version in the future:
		 * 		1. when m > n:
		 * 			- then the offsprings are '... + m + n + 1' AND '... + m + <n+1>'
		 * 		2. when m,n > 1 & m = n
		 * 			- then the offspring is '... + m + n + 1' -> which means it will match case 1. on the next iteration
		 * 		3. when m = 1 & n = 1
		 * 			- the chain will just have '+ 1' added on every future generation and doesn't have to be tracked
		 * 	- as a result, sum chain count for the next iteration is the sum of
		 * 		- the previous iteration sum chain count
		 * 		- 1 (for newly created '<n-1> + 1' sum chain)
		 * 		- the amount of chains from the previous iteration that match case 1.
		 * 	- then update the sum chain endings that match case 1. or 2. for the next generation
		 *
		 * //TODO: determine if there is an even faster algorithm to determine the amount of sum chains that are capable of reproduction
		 */
		let currentWayCount = 0;

		// sum chains that match case 1. will create extra sum chains on the next iteration
		let reproducingSumChainEndings: Array<[number, number]> = [];
		// sum chains that match case 2. will create extra sum chains in two iterations
		let reproductionCapableSumChainEndings: Array<number> = [];

		let additionalPrecalculatedWaysCount = 0;
		for (let index = 2; index <= data; index++) {
			currentWayCount += 1 + reproducingSumChainEndings.length;

			const newReproducingSumChainEndings: Array<[number, number]> = [];
			const newReproductionCapableSumChainEndings: Array<number> = [];

			for (const [secondToLast, last] of reproducingSumChainEndings) {
				// '... + secondToLast + last + 1'
				if (last > 1) {
					if (last <= 2) {
						additionalPrecalculatedWaysCount += this.#calculateAdditionalWaysForNPlusOneTails(last, data - index);
					} else {
						newReproducingSumChainEndings.push([last, 1]);
					}
				}

				// '... + secondToLast + <last+1>'
				if (secondToLast > last + 1) {
					newReproducingSumChainEndings.push([secondToLast, last + 1]);
				} else {
					// secondToLast === (last + 1)
					newReproductionCapableSumChainEndings.push(secondToLast);
				}
			}

			for (const last of reproductionCapableSumChainEndings) {
				newReproducingSumChainEndings.push([last, 1]);
			}

			if (index > 2) {
				// the 1 + 1 sum chain created on the first iteration is not able to reproduce
				newReproducingSumChainEndings.push([index - 1, 1]);
			}

			reproducingSumChainEndings = newReproducingSumChainEndings;
			reproductionCapableSumChainEndings = newReproductionCapableSumChainEndings;
		}

		return currentWayCount + additionalPrecalculatedWaysCount;
	}

	#calculateAdditionalWaysForNPlusOneTails(n: number, remainingIterations: number): number {
		const nMinusOne = n - 1;

		// ... n + 1, ... n + n + 1
		let additionalWays = Math.floor((remainingIterations + nMinusOne) / n);

		// TODO currently unfinished for n > 2
		if (n > 2) {
			while (remainingIterations > nMinusOne) {
				// ... n + 2 + 1, ... n + n + 2 + 1
				additionalWays += this.#calculateAdditionalWaysForNPlusOneTails(nMinusOne, remainingIterations - nMinusOne) + 1;
				remainingIterations -= n;
				additionalWays += this.#calculateAdditionalWaysForNPlusOneTails(n, remainingIterations) + 1;
			}
		}

		return additionalWays;
	}

	public "Total Ways to Sum II"(data: [number, Array<number>]): number {
		throw new UnimplementedSolutionError();
	}

	public "Spiralize Matrix"(data: Array<Array<number>>): Array<number> {
		throw new UnimplementedSolutionError();
	}

	public "Array Jumping Game"(data: Array<number>): 1 | 0 {
		let maxReachableIndex = 0;
		for (let index = 0; index <= maxReachableIndex; index++) {
			const currentJumpLength = data[index];
			const currentReachableIndex = index + currentJumpLength;

			if (currentReachableIndex >= data.length - 1) {
				return 1;
			}
			if (currentReachableIndex > maxReachableIndex) {
				maxReachableIndex = currentReachableIndex;
			}
		}
		return 0;
	}

	public "Array Jumping Game II"(data: Array<number>): number {
		const hasSolution = this["Array Jumping Game"](data);

		if (!hasSolution) {
			return 0;
		}

		let jumpCount = 0;
		let minIndexThatCanReachEnd = data.length - 1;

		while (minIndexThatCanReachEnd !== 0) {
			let currentJumpMinStartIndex = Infinity;
			for (let index = minIndexThatCanReachEnd - 1; index >= 0; index--) {
				const jumpLength = data[index];
				if (index + jumpLength >= minIndexThatCanReachEnd) {
					currentJumpMinStartIndex = index;
				}
			}
			minIndexThatCanReachEnd = currentJumpMinStartIndex;
			jumpCount++;
		}
		return jumpCount;
	}

	public "Merge Overlapping Intervals"(data: Array<[number, number]>): Array<[number, number]> {
		if (data.length === 0) {
			return [];
		}

		data.sort((a, b) => a[0] - b[0]);
		const nonOverlappingIntervals: Array<[number, number]> = [data.shift()!];

		for (const currentInterval of data) {
			const lastInterval = nonOverlappingIntervals[nonOverlappingIntervals.length - 1];
			if (currentInterval[0] > lastInterval[1]) {
				nonOverlappingIntervals.push(currentInterval);
			} else if (currentInterval[1] > lastInterval[1]) {
				lastInterval[1] = currentInterval[1];
			}
		}
		return nonOverlappingIntervals;
	}

	public "Generate IP Addresses"(data: string): Array<string> {
		throw new UnimplementedSolutionError();
	}

	public "Algorithmic Stock Trader I"(data: Array<number>): number {
		if (data.length === 0) {
			return 0;
		}

		let lowestPrice = data[0];
		let maxProfit = 0;

		for (const day of data) {
			if (day < lowestPrice) {
				lowestPrice = day;
			} else if (day - lowestPrice > maxProfit) {
				maxProfit = day - lowestPrice;
			}
		}

		return maxProfit;
	}

	public "Algorithmic Stock Trader II"(data: Array<number>): number {
		throw new UnimplementedSolutionError();
	}

	public "Algorithmic Stock Trader III"(data: Array<number>): number {
		throw new UnimplementedSolutionError();
	}

	public "Algorithmic Stock Trader IV"(data: [number, Array<number>]): number {
		throw new UnimplementedSolutionError();
	}

	public "Minimum Path Sum in a Triangle"(data: Array<Array<number>>): number {
		throw new UnimplementedSolutionError();
	}

	public "Unique Paths in a Grid I"(data: [number, number]): number {
		let [length, width] = data;

		/**
		 * Idea:
		 * all fields in the last column and last row have only 1 path to the end
		 * for every other field, the amount of paths to the end is the sum of the paths of the field to the right and the field below it
		 * a resulting grid of path counts might look like this for a 4x3 grid:
		 * 10  4  1
		 *  6  3  1
		 *  3  2  1
		 *  1  1  1
		 * so the calculation can be done iteratively starting from bottom to top and right to left while only tracking one field in each row
		 *
		 * a minor RAM optimization can be done by minimizing the amount of tracked fields by tracking a row or column depending on which one is smaller
		 */
		if (width > length) {
			[width, length] = [length, width];
		}

		const currentRowPathCounts = new Array(width).fill(1);
		for (let x = length - 1; x > 0; x--) {
			for (let y = width - 1; y > 0; y--) {
				currentRowPathCounts[y - 1] = currentRowPathCounts[y] + currentRowPathCounts[y - 1];
			}
		}
		return currentRowPathCounts[0];
	}

	public "Unique Paths in a Grid II"(data: Array<Array<1 | 0>>): number {
		throw new UnimplementedSolutionError();
	}

	public "Shortest Path in a Grid"(data: Array<Array<1 | 0>>): string {
		throw new UnimplementedSolutionError();
	}

	public "Sanitize Parentheses in Expression"(data: string): Array<string> {
		throw new UnimplementedSolutionError();
	}

	public "Find All Valid Math Expressions"(data: [string, number]): Array<string> {
		throw new UnimplementedSolutionError();
	}

	public "HammingCodes: Integer to Encoded Binary"(data: number): string {
		throw new UnimplementedSolutionError();
	}

	public "HammingCodes: Encoded Binary to Integer"(data: string): number {
		throw new UnimplementedSolutionError();
	}

	public "Proper 2-Coloring of a Graph"(data: [number, Array<[number, number]>]): Array<1 | 0> {
		throw new UnimplementedSolutionError();
	}

	public "Compression I: RLE Compression"(data: string): string {
		throw new UnimplementedSolutionError();
	}

	public "Compression II: LZ Decompression"(data: string): string {
		throw new UnimplementedSolutionError();
	}

	public "Compression III: LZ Compression"(data: string): string {
		throw new UnimplementedSolutionError();
	}

	public "Encryption I: Caesar Cipher"(data: [string, number]): string {
		const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const alphabetLength = alphabet.length;
		const charsToIgnore = [" "];

		const [input, offset] = data;
		const positiveOffset = (alphabetLength - (offset % alphabetLength)) % alphabetLength;

		return input
			.split("")
			.map((char) => {
				if (charsToIgnore.includes(char)) {
					return char;
				}

				const alphabetIndex = alphabet.indexOf(char);

				if (alphabetIndex < 0) {
					throw new Error(`Invalid character '${char}'.`);
				}

				return alphabet.charAt((alphabetIndex + positiveOffset) % alphabetLength);
			})
			.join("");
	}

	public "Encryption II: Vigenère Cipher"(data: [string, string]): string {
		const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const alphabetLength = alphabet.length;
		const charsToIgnore = [" "];

		let [input, encoding] = data;

		while (encoding.length < input.length) {
			encoding += encoding;
		}

		let result = "";
		for (let index = 0; index < input.length; index++) {
			const inputChar = input.charAt(index);
			const encodingChar = encoding.charAt(index);

			if (charsToIgnore.includes(inputChar)) {
				result += inputChar;
				continue;
			}

			const resultCharIndex = (alphabet.indexOf(inputChar) + alphabet.indexOf(encodingChar)) % alphabetLength;
			const resultChar = alphabet.charAt(resultCharIndex);

			result += resultChar;
		}

		return result;
	}

	public "Square Root"(data: bigint): bigint {
		throw new UnimplementedSolutionError();
	}

	public "Total Number of Primes"(data: Array<number>): number {
		throw new UnimplementedSolutionError();
	}

	public "Largest Rectangle in a Matrix"(data: Array<Array<1 | 0>>): [[number, number], [number, number]] {
		throw new UnimplementedSolutionError();
	}
}

export class UnimplementedSolutionError extends Error {
	// biome-ignore lint/complexity/noUselessConstructor: override Error constructor overloads
	public constructor() {
		super();
	}
}
