/**
 * Genuine, hand-written editorial context for non-equity market instruments
 * (indices, currency pairs, commodities, crypto, sector ETFs, Treasury yields).
 *
 * These symbols have no matched CompanyEntity, so /markets/quote/[symbol] would
 * otherwise fall back entirely to buildOverviewParagraph() — a deterministic,
 * numbers-only sentence generator (see asset-overview-text.ts's own doc comment:
 * "last-resort fallback"). That's fine as a live-data summary, but it is not
 * real editorial content: dozens of these pages ended up clustered in the
 * 200-230 word range, nearly all of it template/UI chrome plus a formulaic
 * paragraph. This file supplies what the numbers-only fallback can't: what the
 * instrument actually is, how it's constructed, and why it's watched — the
 * same kind of substance a stock's `company.description` provides.
 *
 * Keyed by canonical symbol (see MARKET_GROUPS in marketsLoader.ts).
 */
export const ASSET_EDITORIAL_CONTENT: Record<string, string> = {
  // ── US indices ──
  DJI: "The Dow Jones Industrial Average tracks 30 large, publicly traded U.S. companies spanning major industries — though notably not transportation or utilities, which have their own separate Dow averages. First published in 1896, it's one of the oldest stock market indices still in continuous use. Unlike most modern benchmarks, the Dow is price-weighted rather than weighted by market capitalization: a $500 stock moves the index more than a $50 stock regardless of which company is actually larger, a structural quirk that sets it apart from indices like the S&P 500.",
  SPX: "The S&P 500 tracks roughly 500 of the largest publicly traded U.S. companies, selected by a committee for liquidity and sector representation rather than by a strict size cutoff alone. It's weighted by market capitalization, so larger companies move the index more than smaller ones, and it's widely treated as the default benchmark for U.S. large-cap equity performance — the basis for trillions of dollars in index funds, ETFs, and derivatives.",
  IXIC: "The Nasdaq Composite is a market-cap-weighted index of nearly every stock listed on the Nasdaq exchange, which makes it noticeably more concentrated in technology companies than broader benchmarks, since most major U.S. tech listings trade on Nasdaq. It's broader than the more commonly quoted Nasdaq-100, which deliberately excludes financial companies.",
  RUT: "The Russell 2000 tracks the 2,000 smallest companies in the broader Russell 3000 index, making it the standard benchmark for U.S. small-cap stock performance. Because small-cap companies tend to be more sensitive to domestic economic conditions and financing costs than large multinationals, the Russell 2000 often behaves differently than large-cap indices like the S&P 500 during shifts in interest rates or economic outlook.",
  VIX: "The CBOE Volatility Index — nicknamed the \"fear gauge\" — measures the market's expectation of S&P 500 volatility over the next 30 days, calculated from the prices of S&P 500 index options. It tends to spike during periods of market stress and drift lower during calm, steadily rising markets. The VIX itself isn't directly tradeable, but VIX futures and options let investors take positions on expected volatility.",

  // ── Europe ──
  EUROPE: "The STOXX Europe 600 tracks 600 companies across 17 European countries, spanning large-, mid-, and small-cap stocks. Its broad geographic and size coverage makes it a common proxy for pan-European equity performance, in contrast to narrower single-country benchmarks like the FTSE 100 or DAX.",
  FTSE100: "The FTSE 100 tracks the 100 largest companies listed on the London Stock Exchange by market capitalization. It's heavily weighted toward multinational commodity, financial, and consumer-goods companies — many of which earn the majority of their revenue outside the U.K. — so it tracks global corporate earnings more closely than it tracks the domestic U.K. economy.",
  DAX: "The DAX tracks the 40 largest and most liquid companies listed on the Frankfurt Stock Exchange, serving as Germany's blue-chip benchmark. Unusually among major global indices, the DAX is a total-return index — dividends paid by constituent companies are reinvested into the index calculation rather than only tracking price changes, which tends to make its long-term return figures look higher than a price-only index over the same period.",
  CAC40: "The CAC 40 tracks the 40 largest French companies by market capitalization and trading volume listed on Euronext Paris, and serves as France's leading equity benchmark.",
  IBEX35: "The IBEX 35 tracks the 35 most liquid Spanish companies listed on Spain's continuous market, and is the principal benchmark for Spanish equities.",
  FTSEMIB: "The FTSE MIB tracks roughly the 40 largest and most liquid companies listed on Borsa Italiana in Milan, and serves as Italy's primary equity benchmark.",

  // ── Asia-Pacific ──
  APAC: "This index is a composite proxy tracking broad Asia-Pacific equity performance across the region's major developed markets, used here as a regional summary rather than a single official benchmark.",
  NIKKEI: "The Nikkei 225 tracks 225 large companies listed on the Tokyo Stock Exchange and is Japan's most widely cited equity benchmark. Like the Dow Jones Industrial Average, it's price-weighted rather than weighted by market capitalization, so higher-priced constituent stocks move the index more than lower-priced ones of equal company size.",
  KOSPI: "The KOSPI tracks all common stocks listed on the main board of the Korea Exchange, and is South Korea's principal equity benchmark. It's weighted heavily toward large technology and industrial conglomerates, which make up a significant share of the South Korean economy.",
  ASX200: "The ASX 200 tracks the 200 largest companies listed on the Australian Securities Exchange by market capitalization, and is Australia's leading equity benchmark, with heavy representation from financial and mining companies.",

  // ── China / Hong Kong ──
  HANGSENG: "The Hang Seng Index tracks the largest and most liquid companies listed on the Hong Kong Stock Exchange, and is the primary benchmark for Hong Kong equities, including major mainland Chinese companies dual-listed in Hong Kong.",
  SHANGHAI: "The Shanghai Composite tracks all A-shares and B-shares listed on the Shanghai Stock Exchange, and is mainland China's principal equity benchmark, dominated by large state-owned financial and industrial companies.",

  // ── Emerging markets ──
  BOVESPA: "The Bovespa Index tracks the most liquid stocks traded on Brazil's B3 exchange, and is the principal benchmark for Brazilian equities, weighted heavily toward commodity, financial, and energy companies.",
  SENSEX: "The Sensex tracks 30 large, financially established companies listed on the Bombay Stock Exchange, and is India's most widely followed equity benchmark.",

  // ── Crypto ──
  BTC: "Bitcoin is the first and largest cryptocurrency by market capitalization, launched in 2009 as a decentralized digital currency secured by a proof-of-work blockchain. Its protocol caps total supply at 21 million coins, a fixed limit often cited by proponents as a structural contrast to fiat currencies with no hard supply ceiling.",
  ETH: "Ethereum is the second-largest cryptocurrency by market capitalization — a blockchain platform designed to support smart contracts and decentralized applications, not just peer-to-peer payments. In 2022, Ethereum transitioned its consensus mechanism from proof-of-work to proof-of-stake, substantially reducing the network's energy consumption.",
  SOL: "Solana is a high-throughput blockchain platform built for fast transaction speeds and low fees, using a proof-of-history and proof-of-stake hybrid consensus model. It's widely used as an infrastructure layer for decentralized finance applications and NFT platforms that need faster, cheaper settlement than older blockchain networks provide.",

  // ── Commodities ──
  XAUUSD: "This is the price of one troy ounce of gold, quoted in U.S. dollars. Gold has traditionally been viewed as a store of value and a hedge against inflation and currency depreciation, and it remains a significant component of many central banks' foreign exchange reserves.",
  WTI: "West Texas Intermediate (WTI) is a light, sweet crude oil grade that serves as the primary U.S. benchmark for oil pricing, traded on the NYMEX. \"Light, sweet\" refers to its low density and low sulfur content, which make it relatively easy and cheap to refine into gasoline compared with heavier, higher-sulfur crude grades.",
  BRENT: "Brent Crude is a light, sweet oil blend sourced from North Sea fields, and serves as the leading international benchmark for oil pricing outside North America — most oil traded globally is priced with reference to Brent rather than WTI.",
  NATGAS: "This tracks the Henry Hub natural gas futures price, the benchmark for North American natural gas pricing, named for a physical pipeline interchange in Louisiana where the futures contracts are notionally delivered.",
  COPPER: "This tracks the COMEX copper futures price. Because copper is used extensively in construction, electrical wiring, and industrial manufacturing, its price is widely watched as a leading indicator of global industrial and economic activity — sometimes nicknamed \"Dr. Copper\" for its supposed ability to diagnose the health of the economy.",

  // ── Currencies ──
  EURUSD: "EUR/USD is the exchange rate between the euro and the U.S. dollar — the most heavily traded currency pair in the world by daily volume, reflecting the size and liquidity of both the eurozone and U.S. economies.",
  GBPUSD: "GBP/USD is the exchange rate between the British pound and the U.S. dollar, historically nicknamed \"cable\" after the transatlantic telegraph cables once used to transmit exchange rate quotes between London and New York.",
  USDJPY: "USD/JPY is the exchange rate between the U.S. dollar and Japanese yen, one of the most liquid currency pairs globally. It's closely tied to Bank of Japan monetary policy and to carry-trade activity, where investors borrow in low-yielding yen to invest in higher-yielding assets elsewhere.",
  USDINR: "USD/INR is the exchange rate between the U.S. dollar and the Indian rupee, influenced by India's trade balance, foreign investment flows, and Reserve Bank of India policy.",
  USDCNY: "USD/CNY is the exchange rate between the U.S. dollar and the Chinese yuan's onshore rate, which trades within a managed band set daily by the People's Bank of China rather than floating freely like most major currency pairs.",
  USDBRL: "USD/BRL is the exchange rate between the U.S. dollar and the Brazilian real, sensitive to Brazilian interest rate policy, commodity export prices, and broader emerging-market risk sentiment.",

  // ── Sector ETFs ──
  XLK: "The Technology Select Sector SPDR Fund (XLK) tracks the technology sector companies within the S&P 500, giving investors exposure to that sector without having to hold each constituent stock individually.",
  XLE: "The Energy Select Sector SPDR Fund (XLE) tracks the energy sector companies within the S&P 500, including major oil, gas, and energy-equipment producers.",
  XLV: "The Health Care Select Sector SPDR Fund (XLV) tracks the health care sector companies within the S&P 500, including pharmaceutical, biotechnology, and health-insurance companies.",
  XLF: "The Financial Select Sector SPDR Fund (XLF) tracks the financial sector companies within the S&P 500, including major banks, insurers, and asset managers.",
  XLY: "The Consumer Discretionary Select Sector SPDR Fund (XLY) tracks the consumer discretionary sector companies within the S&P 500 — retailers, automakers, and other businesses whose sales tend to rise and fall with consumer spending on non-essential goods.",

  // ── Treasury yields ──
  DGS10: "This tracks the 10-Year Treasury Constant Maturity Rate — the yield on U.S. government debt maturing in 10 years. It's one of the most closely watched figures in finance, widely used as a reference point for mortgage rates and long-term corporate borrowing costs, and treated by many investors as a signal of the market's expectations for economic growth and inflation over the coming decade.",
};
