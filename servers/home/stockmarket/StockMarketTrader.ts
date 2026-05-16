import PositionType from "./PositionType";
import StockMarketDataHandler, { type StockData } from "./StockMarketDataHandler";
import StockMarketStatusHandler from "./StockMarketStatusHandler";

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
	readonly #statusHandler;

	readonly #ns;
	readonly #api;

	#stockData: Array<StockData> = [];

	constructor(ns: NS) {
		this.#dataHandler = new StockMarketDataHandler(ns);
		this.#statusHandler = new StockMarketStatusHandler(ns);

		this.#ns = ns;
		this.#api = ns.stock;
	}

	public async trade(): Promise<void> {
		this.#stockData = this.#dataHandler.getAllStockData();
		this.#statusHandler.updateWith(this.#stockData);

		this.#resolveExistingPositions();
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

			if (stockData.type !== PositionType.LONG) {
				continue;
			}

			const availableShares = stockData.maxShares - stockData.longShares;
			const maxPurchaseCost = this.#api.getPurchaseCost(stockData.symbol, availableShares, PositionType.LONG);

			// TODO: profitability calculation based on market fees & spread

			while (this.#hasEnoughMoneyFor(maxPurchaseCost)) {
				const leastProfitablePositionIndex = this.#stockData.findLastIndex((stock) => stock.longShares > 0);

				if (currentRank >= leastProfitablePositionIndex) {
					break; // no less profitable positions left to sell
				}

				this.#sellLongPosition(this.#stockData[leastProfitablePositionIndex]);
			}

			this.#buyLongPosition(stockData);
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

			if (boughtShares > 0) {
				this.#ns.printf(`Bought ${boughtShares} shares of stock: ${stockData.symbol}.`);
			}
		}
	}

	public async nextTick() {
		await this.#api.nextUpdate();
		return true;
	}
}
