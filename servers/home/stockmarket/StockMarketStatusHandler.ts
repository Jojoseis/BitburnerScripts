import PositionType from "./PositionType";
import type { StockData } from "./StockMarketDataHandler";

type Status = {
	topLongStocks: Array<string>;
	// TODO: topShortStocks: Array<string>;
	topMarketCapStock: string;
};

export default class StockMarketStatusHandler {
	static readonly #TOP_STOCK_COUNT = 3;

	readonly #ns;

	readonly #lastStatus: Status = {
		topLongStocks: [],
		topMarketCapStock: "",
	};

	constructor(ns: NS) {
		this.#ns = ns;
	}

	public updateWith(stockData: Array<StockData>) {
		const topLongStocks = stockData
			.filter((stock) => stock.type === PositionType.LONG)
			.map((stock) => stock.symbol)
			.slice(0, StockMarketStatusHandler.#TOP_STOCK_COUNT);

		if (topLongStocks.join(",") !== this.#lastStatus.topLongStocks.join(",")) {
			this.#lastStatus.topLongStocks = topLongStocks;
			this.#ns.printf(`Top long stocks: ${topLongStocks.join(", ")}.`);
		}

		const topMarketCapStock = stockData.reduce((prev, curr) => {
			if (prev && prev.maxShares * prev.price > curr.maxShares * curr.price) {
				return prev;
			} else {
				return curr;
			}
		}).symbol;

		if (topMarketCapStock !== this.#lastStatus.topMarketCapStock) {
			this.#lastStatus.topMarketCapStock = topMarketCapStock;
			this.#ns.printf(`Top market cap stock: ${topMarketCapStock}.`);
		}
	}
}
