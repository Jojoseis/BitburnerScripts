import FilePaths from "../utils/FilePaths";

const RETRY_DELAY = 1000;
const FUND_BUFFER = 5_000_000_000;

export async function main(ns: NS) {
	await buyStockExchangeRequirements(ns);
	ns.alert("Stock market API fully accessible! Now starting auto trade.");
	ns.run(FilePaths.STOCK_MARKET_TRADER);
}

async function buyStockExchangeRequirements(ns: NS) {
	const stockConstants = ns.stock.getConstants();

	while (true) {
		let hasWseAccount = ns.stock.hasWseAccount();
		if (!ns.stock.hasWseAccount() && canAffortPurchase(ns, stockConstants.TixApiCost)) {
			hasWseAccount = ns.stock.purchaseWseAccount();
		}

		let hasTixApiAccess = ns.stock.hasTixApiAccess();
		if (!hasTixApiAccess && canAffortPurchase(ns, stockConstants.TixApiCost)) {
			hasTixApiAccess = ns.stock.purchaseTixApi();
		}

		let has4SData = ns.stock.has4SData();
		if (!has4SData && canAffortPurchase(ns, stockConstants.MarketData4SCost)) {
			has4SData = ns.stock.purchase4SMarketData();
		}

		let has4SDataTixApi = ns.stock.has4SDataTixApi();
		if (!has4SDataTixApi && canAffortPurchase(ns, stockConstants.MarketDataTixApi4SCost)) {
			has4SDataTixApi = ns.stock.purchase4SMarketDataTixApi();
		}

		if (hasWseAccount && hasTixApiAccess && has4SData && has4SDataTixApi) {
			return;
		}

		await ns.sleep(RETRY_DELAY);
	}
}

function canAffortPurchase(ns: NS, cost: number) {
	const currentFunds = ns.getServerMoneyAvailable("home");
	return currentFunds > cost + FUND_BUFFER;
}
