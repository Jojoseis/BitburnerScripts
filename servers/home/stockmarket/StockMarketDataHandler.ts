import PositionType from "./PositionType.ts";

export type StockData = StockKeyData & {
	expectedGain: number;
	type: PositionType;
	spread: number;

	longShares: number;
	shortShares: number;
};

export type StockKeyData = {
	symbol: string;

	askPrice: number;
	bidPrice: number;
	forecast: number;
	maxShares: number;
	maxVolatility: number;
	price: number;
};

export default class StockMarketDataHandler {
	readonly #api;

	public constructor(ns: NS) {
		this.#api = ns.stock;
	}

	getAllStockData() {
		return this.#api
			.getSymbols()
			.map((sym) => this.#getStockData(sym))
			.sort(this.#sortByAbsoluteExpectedChange);
	}

	#getStockData(sym: string): StockData {
		const stockKeyData = this.#getStockKeyData(sym);

		const spread = stockKeyData.bidPrice / stockKeyData.askPrice;
		const expectedVolatility = stockKeyData.maxVolatility / 2;

		const expectedGain = expectedVolatility * stockKeyData.forecast; // the actual expected % change next tick

		const position = this.#api.getPosition(sym);

		return {
			...stockKeyData,
			expectedGain: expectedGain,
			type: expectedGain > 0 ? PositionType.LONG : PositionType.SHORT,
			spread: spread,

			longShares: position[0],
			shortShares: position[2],
		};
	}

	#getStockKeyData(sym: string): StockKeyData {
		return {
			symbol: sym,

			askPrice: this.#api.getForecast(sym),
			bidPrice: this.#api.getBidPrice(sym),
			forecast: this.#api.getForecast(sym) * 2 - 1, // 0 to 1 range -> 1 to -1 range
			maxShares: this.#api.getMaxShares(sym),
			maxVolatility: this.#api.getVolatility(sym),
			price: this.#api.getPrice(sym),
		};
	}

	#sortByAbsoluteExpectedChange(stockDataA: StockData, stockDataB: StockData): number {
		return Math.abs(stockDataB.expectedGain) - Math.abs(stockDataA.expectedGain);
	}
}
