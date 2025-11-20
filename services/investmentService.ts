export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: Date;
}

export interface Portfolio {
  holdings: PortfolioHolding[];
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export class InvestmentService {
  private static readonly API_BASE = "https://query1.finance.yahoo.com/v8/finance";
  
  static async getStockQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await fetch(
        `${this.API_BASE}/chart/${symbol.toUpperCase()}?interval=1d&range=1d`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch stock data");
      }
      
      const data = await response.json();
      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];
      
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.chartPreviousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return {
        symbol: symbol.toUpperCase(),
        name: meta.symbol,
        price: currentPrice,
        change,
        changePercent,
        high: quote.high[quote.high.length - 1] || currentPrice,
        low: quote.low[quote.low.length - 1] || currentPrice,
        volume: quote.volume[quote.volume.length - 1] || 0,
        timestamp: new Date(meta.regularMarketTime * 1000),
      };
    } catch (error) {
      console.error("Stock quote error:", error);
      return this.getMockQuote(symbol);
    }
  }
  
  static async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    const promises = symbols.map(symbol => this.getStockQuote(symbol));
    return Promise.all(promises);
  }
  
  static calculatePortfolio(holdings: Array<{
    symbol: string;
    shares: number;
    avgCost: number;
  }>, quotes: StockQuote[]): Portfolio {
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));
    
    const portfolioHoldings: PortfolioHolding[] = holdings.map(holding => {
      const quote = quoteMap.get(holding.symbol.toUpperCase());
      const currentPrice = quote?.price || holding.avgCost;
      const totalValue = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avgCost;
      const gainLoss = totalValue - costBasis;
      const gainLossPercent = (gainLoss / costBasis) * 100;
      
      return {
        symbol: holding.symbol.toUpperCase(),
        name: quote?.name || holding.symbol,
        shares: holding.shares,
        avgCost: holding.avgCost,
        currentPrice,
        totalValue,
        gainLoss,
        gainLossPercent,
      };
    });
    
    const totalValue = portfolioHoldings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalCost = portfolioHoldings.reduce((sum, h) => sum + (h.shares * h.avgCost), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = (totalGainLoss / totalCost) * 100;
    
    return {
      holdings: portfolioHoldings,
      totalValue,
      totalGainLoss,
      totalGainLossPercent,
    };
  }
  
  static async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string }>> {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`
      );
      
      if (!response.ok) {
        throw new Error("Search failed");
      }
      
      const data = await response.json();
      
      return (data.quotes || []).map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
      }));
    } catch (error) {
      console.error("Symbol search error:", error);
      return [];
    }
  }
  
  private static getMockQuote(symbol: string): StockQuote {
    const basePrice = 100 + Math.random() * 400;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      price: basePrice,
      change,
      changePercent,
      high: basePrice + Math.abs(change),
      low: basePrice - Math.abs(change),
      volume: Math.floor(Math.random() * 10000000),
      timestamp: new Date(),
    };
  }
}

export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
}

export class CryptoService {
  static async getCryptoQuote(symbol: string): Promise<CryptoQuote> {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      );
      
      if (!response.ok) {
        throw new Error("Crypto API failed");
      }
      
      const data = await response.json();
      const cryptoData = data[symbol.toLowerCase()];
      
      if (!cryptoData) {
        throw new Error("Crypto not found");
      }
      
      return {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        price: cryptoData.usd,
        change24h: (cryptoData.usd * cryptoData.usd_24h_change) / 100,
        changePercent24h: cryptoData.usd_24h_change,
        marketCap: cryptoData.usd_market_cap || 0,
        volume24h: cryptoData.usd_24h_vol || 0,
      };
    } catch (error) {
      console.error("Crypto quote error:", error);
      throw error;
    }
  }
  
  static async getTopCryptos(limit: number = 10): Promise<CryptoQuote[]> {
    const topCoins = ["bitcoin", "ethereum", "binancecoin", "cardano", "solana", "polkadot", "dogecoin", "avalanche", "chainlink", "polygon"];
    
    const promises = topCoins.slice(0, limit).map(coin => this.getCryptoQuote(coin));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((r): r is PromiseFulfilledResult<CryptoQuote> => r.status === "fulfilled")
      .map(r => r.value);
  }
}
