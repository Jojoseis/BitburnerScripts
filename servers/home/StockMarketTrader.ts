type StockData = StockKeyData & {
	expectedGain: number;
	type: PositionType;
	spread: number;

	longShares: number;
	shortShares: number;
};

type StockKeyData = {
	symbol: string;

	askPrice: number;
	bidPrice: number;
	forecast: number;
	maxShares: number;
	maxVolatility: number;
	price: number;
};

type Status = {
	topLongStocks: Array<string>;
	// TODO: topShortStocks: Array<string>;
	topMarketCapStock: string;
};

enum PositionType {
	LONG = "L",
	SHORT = "S",
}

export async function main(ns: NS) {
	ns.disableLog("ALL");

	const trader = new StockMarketTrader(ns);

	while (await trader.nextTick()) {
		await trader.trade();
	}
}

class StockMarketTrader {
	static readonly #FUND_BUFFER = 10_000_000_000;

	readonly #dataHandler;
	readonly #statusHandler: StockMarketStatusHandler;

	readonly #ns;
	readonly #api;
	readonly #constants;

	// TODO: simplify logic by unifying both arrays
	#stockData: Array<StockData> = [];
	#currentPositions: Array<StockData> = [];

	constructor(ns: NS) {
		this.#dataHandler = new StockMarketDataHandler(ns);
		this.#statusHandler = new StockMarketStatusHandler(ns);

		this.#ns = ns;
		this.#api = ns.stock;
		this.#constants = this.#api.getConstants();
	}

	public async trade(): Promise<void> {
		this.#stockData = this.#dataHandler.getAllStockData();
		this.#statusHandler.updateWith(this.#stockData);

		this.#currentPositions = this.#resolveExistingPositions();

		this.#optimizeStock();
	}

	#resolveExistingPositions() {
		const currentPositions = [];
		for (const stockData of this.#stockData) {
			// sell unprofitable positions
			if (stockData.type === PositionType.LONG && stockData.shortShares > 0) {
				this.#api.sellShort(stockData.symbol, stockData.shortShares);
				stockData.shortShares = 0;
			} else if (stockData.type === PositionType.SHORT && stockData.longShares > 0) {
				this.#sellLongPosition(stockData);
			}

			if (stockData.longShares + stockData.shortShares) {
				currentPositions.push(stockData);
			}
		}
		return currentPositions;
	}

	#optimizeStock(): void {
		for (const stockData of this.#stockData) {
			const currentRank = this.#getStockRank(stockData.symbol);

			if (stockData.type === PositionType.LONG) {
				const availableShares = stockData.maxShares - stockData.longShares;
				const maxPurchaseCost = this.#api.getPurchaseCost(stockData.symbol, availableShares, PositionType.LONG);

				// TODO: profitability calculation based on market fees & spread

				while (this.#hasEnoughMoneyFor(maxPurchaseCost) && this.#currentPositions.length > 0) {
					const leastProfitablePosition = this.#currentPositions[this.#currentPositions.length - 1];

					if (this.#getStockRank(leastProfitablePosition.symbol) <= currentRank) {
						break; // no less profitable positions left to sell
					}

					this.#sellLongPosition(leastProfitablePosition);
				}

				this.#buyLongPosition(stockData);
			} else if (this.#isShortingEnabled()) {
				// TODO
			}
		}
	}

	#getStockRank(symbol: string): number {
		return this.#stockData.findIndex((data) => data.symbol === symbol);
	}

	#hasEnoughMoneyFor(money: number): boolean {
		const availableMoney = this.#ns.getServerMoneyAvailable("home") - StockMarketTrader.#FUND_BUFFER;
		return money <= availableMoney;
	}

	#sellLongPosition(stockData: StockData) {
		const soldShares = this.#api.sellStock(stockData.symbol, stockData.longShares);
		stockData.longShares = 0;

		const indexOfPosition = this.#currentPositions.findIndex((position) => position.symbol === stockData.symbol);
		this.#currentPositions.splice(indexOfPosition, 1);

		this.#ns.printf(`Sold ${soldShares} shares of stock: ${stockData.symbol}.`);
	}

	#buyLongPosition(stockData: StockData) {
		const availableShares = stockData.maxShares - stockData.longShares;
		const maxPurchaseCost = this.#api.getPurchaseCost(stockData.symbol, availableShares, PositionType.LONG);

		let sharesToBuy = availableShares;
		if (this.#ns.getServerMoneyAvailable("home") - StockMarketTrader.#FUND_BUFFER < maxPurchaseCost) {
			sharesToBuy = availableShares * ((this.#ns.getServerMoneyAvailable("home") - StockMarketTrader.#FUND_BUFFER) / maxPurchaseCost);
		}

		if (sharesToBuy > 0) {
			const boughtShares = this.#api.buyStock(stockData.symbol, sharesToBuy);
			stockData.longShares = boughtShares;

			const indexOfPosition = this.#currentPositions.findIndex((data) => data.symbol === stockData.symbol);
			if (indexOfPosition === -1) {
				this.#currentPositions.unshift(stockData);
				this.#currentPositions.sort(
					(stockDataA, stockDataB) => this.#getStockRank(stockDataA.symbol) - this.#getStockRank(stockDataB.symbol),
				);
			}

			if (boughtShares > 0) {
				this.#ns.printf(`Bought ${boughtShares} shares of stock: ${stockData.symbol}.`);
			}
		}
	}

	#isShortingEnabled(): boolean {
		return false; // TODO
	}

	public async nextTick() {
		await this.#api.nextUpdate();
		return true;
	}
}

class StockMarketDataHandler {
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

class StockMarketStatusHandler {
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
