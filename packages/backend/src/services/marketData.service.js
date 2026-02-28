/**
 * Market Data Service v2 — Intelligent API Router
 * 
 * Classifies questions by intent, then ONLY fetches relevant APIs.
 * Supports: CoinGecko, DexScreener, DefiLlama, Fear & Greed Index, Hedera Mirror Node.
 * All APIs are free and require no API key.
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const DEXSCREENER_BASE = "https://api.dexscreener.com/latest";
const DEFILLAMA_BASE = "https://api.llama.fi";
const FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=7";

/**
 * Helper to fetch with a timeout fallback.
 */
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

// ─── INTENT CLASSIFICATION ─────────────────────────────────────────────────────

const INTENT_KEYWORDS = {
    CRYPTO_PRICE: [
        "price", "worth", "cost", "undervalued", "overvalued", "buy", "sell",
        "bullish", "bearish", "pump", "dump", "moon", "crash", "ath", "atl",
        "market cap", "volume", "trading", "chart", "momentum", "trend",
        "compare", "vs", "versus", "performance", "roi", "gain", "loss"
    ],
    DEFI: [
        "defi", "tvl", "yield", "apy", "apr", "liquidity", "pool", "swap",
        "staking", "farm", "lending", "borrow", "protocol", "dex",
        "saucerswap", "pangolin", "uniswap", "aave", "compound",
        "total value locked", "impermanent loss"
    ],
    SENTIMENT: [
        "sentiment", "fear", "greed", "mood", "market feeling", "index",
        "confidence", "panic", "euphoria", "fomo", "fud"
    ],
    NEWS_SOCIAL: [
        "news", "latest", "recent", "today", "yesterday", "drama", "controversy",
        "scandal", "scam", "rug", "rugpull", "hack", "exploit", "arrest",
        "sec", "regulation", "lawsuit", "ban", "influencer", "kol",
        "zachxbt", "coffeezilla", "do kwon", "sbf", "cz", "binance",
        "market maker", "manipulation", "insider", "whale", "dump",
        "tweet", "twitter", "reddit", "community", "opinion", "people think",
        "trending", "viral", "breaking", "update", "announcement",
        "what happened", "what's going on", "tell me about"
    ],
    HEDERA_ECOSYSTEM: [
        "hedera", "hbar", "hcs", "hts", "hashgraph", "hashpack",
        "saucerswap", "stader", "headstarter", "turtle moon",
        "karate", "dovu", "the hashgraph association"
    ],
};

// Token name -> CoinGecko ID mapping
const COINGECKO_IDS = {
    hbar: "hedera-hashgraph", hedera: "hedera-hashgraph",
    bitcoin: "bitcoin", btc: "bitcoin",
    ethereum: "ethereum", eth: "ethereum",
    solana: "solana", sol: "solana",
    usdc: "usd-coin", usdt: "tether",
    sauce: "saucerswap", saucerswap: "saucerswap",
    bnb: "binancecoin", xrp: "ripple",
    cardano: "cardano", ada: "cardano",
    dogecoin: "dogecoin", doge: "dogecoin",
    avax: "avalanche-2", avalanche: "avalanche-2",
    matic: "matic-network", polygon: "matic-network",
    link: "chainlink", chainlink: "chainlink",
    dot: "polkadot", polkadot: "polkadot",
};

// DeFi protocol -> DefiLlama slug mapping
const DEFILLAMA_PROTOCOLS = {
    saucerswap: "saucerswap", uniswap: "uniswap",
    aave: "aave", compound: "compound-finance",
    lido: "lido", makerdao: "makerdao",
    curve: "curve-dex", pancakeswap: "pancakeswap",
    stader: "stader", "trader joe": "trader-joe",
    "gmx": "gmx", "raydium": "raydium",
    "orca": "orca", "jupiter": "jupiter",
};

// Blockchain chain -> DefiLlama chain name mapping
const CHAIN_NAMES = {
    ethereum: "Ethereum", eth: "Ethereum",
    avalanche: "Avalanche", avax: "Avalanche",
    solana: "Solana", sol: "Solana",
    polygon: "Polygon", matic: "Polygon",
    arbitrum: "Arbitrum", arb: "Arbitrum",
    optimism: "Optimism", op: "Optimism",
    bsc: "BSC", "binance smart chain": "BSC", bnb: "BSC",
    fantom: "Fantom", ftm: "Fantom",
    base: "Base",
    hedera: "Hedera", hbar: "Hedera",
    sui: "Sui",
    aptos: "Aptos", apt: "Aptos",
    tron: "Tron", trx: "Tron",
    near: "Near",
    cosmos: "Cosmos", atom: "Cosmos",
    cardano: "Cardano", ada: "Cardano",
    polkadot: "Polkadot", dot: "Polkadot",
    cronos: "Cronos", cro: "Cronos",
    sei: "Sei",
    mantle: "Mantle",
    zksync: "zkSync Era",
    linea: "Linea",
    scroll: "Scroll",
    blast: "Blast",
    manta: "Manta",
    monad: "Monad",
};

/**
 * Classifies the user's question into one or more intents.
 * Returns only the relevant intents, or NONE if it's a general knowledge question.
 */
function classifyQuestion(question) {
    const lowerQ = question.toLowerCase();
    const intents = new Set();

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
        for (const kw of keywords) {
            if (lowerQ.includes(kw)) {
                intents.add(intent);
                break; // One match per intent category is enough
            }
        }
    }

    // If no crypto/defi intents detected, this is likely a general knowledge question
    if (intents.size === 0) {
        return { intents: [], isGeneralKnowledge: true };
    }

    return { intents: [...intents], isGeneralKnowledge: false };
}

/**
 * Detects which tokens are mentioned in the user's question.
 */
function detectTokens(question) {
    const lowerQ = question.toLowerCase();
    const detected = new Set();

    for (const [keyword, id] of Object.entries(COINGECKO_IDS)) {
        // Use word boundary-like matching to avoid false positives
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(lowerQ)) {
            detected.add(id);
        }
    }

    return [...detected];
}

/**
 * Detects which DeFi protocols are mentioned.
 */
function detectProtocols(question) {
    const lowerQ = question.toLowerCase();
    const detected = [];

    for (const [keyword, slug] of Object.entries(DEFILLAMA_PROTOCOLS)) {
        if (lowerQ.includes(keyword)) {
            detected.push(slug);
        }
    }

    return detected;
}

/**
 * Detects which blockchain chains are mentioned for TVL lookup.
 */
function detectChains(question) {
    const lowerQ = question.toLowerCase();
    const detected = new Set();

    for (const [keyword, chainName] of Object.entries(CHAIN_NAMES)) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(lowerQ)) {
            detected.add(chainName);
        }
    }

    return [...detected];
}

// ─── API FETCHERS ───────────────────────────────────────────────────────────────

async function fetchCoinGeckoData(coinIds) {
    if (coinIds.length === 0) return null;
    try {
        const ids = coinIds.join(",");
        const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d`;
        const response = await fetchWithTimeout(url);
        if (!response.ok) return null;

        const data = await response.json();
        return data.map(coin => ({
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
            marketCap: coin.market_cap,
            volume24h: coin.total_volume,
            change1h: coin.price_change_percentage_1h_in_currency,
            change24h: coin.price_change_percentage_24h,
            change7d: coin.price_change_percentage_7d_in_currency,
            ath: coin.ath,
            athChangePercent: coin.ath_change_percentage,
            circulatingSupply: coin.circulating_supply,
            totalSupply: coin.total_supply,
            lastUpdated: coin.last_updated,
        }));
    } catch (error) {
        console.error("[MarketData] CoinGecko error:", error.message);
        return null;
    }
}

async function fetchDexScreenerData(tokenSymbol) {
    try {
        const url = `${DEXSCREENER_BASE}/dex/search?q=${tokenSymbol}`;
        const response = await fetchWithTimeout(url);
        if (!response.ok) return null;

        const data = await response.json();
        if (!data.pairs || data.pairs.length === 0) return null;

        return data.pairs
            .filter(p => p.volume && p.volume.h24 > 0)
            .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
            .slice(0, 3)
            .map(pair => ({
                dex: pair.dexId, chain: pair.chainId,
                baseToken: pair.baseToken?.symbol, quoteToken: pair.quoteToken?.symbol,
                priceUsd: pair.priceUsd,
                volume24h: pair.volume?.h24, liquidity: pair.liquidity?.usd,
                priceChange5m: pair.priceChange?.m5,
                priceChange1h: pair.priceChange?.h1,
                priceChange24h: pair.priceChange?.h24,
                url: pair.url,
            }));
    } catch (error) {
        console.error("[MarketData] DexScreener error:", error.message);
        return null;
    }
}

async function fetchDefiLlamaProtocol(slug) {
    try {
        const url = `${DEFILLAMA_BASE}/protocol/${slug}`;
        const response = await fetchWithTimeout(url);
        if (!response.ok) return null;

        const data = await response.json();
        const latestTvl = data.tvl?.[data.tvl.length - 1];
        return {
            name: data.name,
            symbol: data.symbol,
            category: data.category,
            tvl: latestTvl?.totalLiquidityUSD,
            chains: data.chains,
            change1d: data.change_1d,
            change7d: data.change_7d,
            change1m: data.change_1m,
            url: data.url,
        };
    } catch (error) {
        console.error("[MarketData] DefiLlama error:", error.message);
        return null;
    }
}

async function fetchDefiLlamaChainTVL(chain = "Hedera") {
    try {
        const url = `${DEFILLAMA_BASE}/v2/chains`;
        const response = await fetchWithTimeout(url);
        if (!response.ok) return null;

        const data = await response.json();
        const chainData = data.find(c => c.name.toLowerCase() === chain.toLowerCase());
        return chainData ? { name: chainData.name, tvl: chainData.tvl } : null;
    } catch (error) {
        console.error("[MarketData] DefiLlama chains error:", error.message);
        return null;
    }
}

async function fetchFearGreedIndex() {
    try {
        const response = await fetchWithTimeout(FEAR_GREED_URL);
        if (!response.ok) return null;

        const data = await response.json();
        return data.data.map(d => ({
            value: d.value,
            classification: d.value_classification,
            timestamp: new Date(d.timestamp * 1000).toISOString().split('T')[0],
        }));
    } catch (error) {
        console.error("[MarketData] Fear & Greed error:", error.message);
        return null;
    }
}

async function fetchHederaNetworkStats() {
    try {
        const network = process.env.HEDERA_NETWORK || "testnet";
        const url = `https://${network}.mirrornode.hedera.com/api/v1/network/supply`;
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        return { totalSupply: data.total_supply, releasedSupply: data.released_supply };
    } catch (error) {
        console.error("[MarketData] Hedera Mirror Node error:", error.message);
        return null;
    }
}

/**
 * Extracts meaningful search keywords from a question by removing stop words.
 */
function extractKeywords(question) {
    const stopWords = new Set([
        "what", "whats", "what's", "is", "the", "a", "an", "of", "in", "on",
        "for", "to", "with", "about", "how", "why", "when", "where", "who",
        "was", "were", "are", "been", "being", "have", "has", "had", "do",
        "does", "did", "will", "would", "could", "should", "can", "may",
        "might", "shall", "must", "need", "me", "my", "i", "you", "your",
        "we", "our", "they", "their", "it", "its", "this", "that", "these",
        "those", "and", "or", "but", "not", "no", "if", "then", "than",
        "so", "very", "just", "also", "tell", "think", "know", "like",
        "going", "happened", "happening", "latest", "recent", "current",
        "last", "up", "down", "out", "get", "got", "any", "some",
    ]);

    return question
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')  // strip punctuation
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));
}

/**
 * Fetches recent Reddit posts using smart keyword extraction & multi-query strategy.
 * Uses Reddit's public JSON API — 100% free, no auth required.
 */
async function fetchRedditPosts(question) {
    try {
        const keywords = extractKeywords(question);
        console.log(`[Reddit] Extracted keywords: ${keywords.join(", ")}`);

        if (keywords.length === 0) return null;

        // Build multiple search queries for better coverage:
        // 1. All keywords combined (specific)
        // 2. First 2-3 important keywords (broader)
        // 3. Each individual keyword longer than 4 chars (widest net)
        const queries = new Set();

        // Combined query
        queries.add(keywords.slice(0, 5).join(" "));

        // Pairs of important keywords
        if (keywords.length >= 2) {
            queries.add(`${keywords[0]} ${keywords[1]}`);
        }

        // Individual important terms (names, protocols, etc.)
        for (const kw of keywords) {
            if (kw.length >= 5) queries.add(kw);
        }

        const subreddits = ["cryptocurrency", "CryptoMarkets", "defi", "ethfinance", "solana"];
        const allPosts = [];

        // For each query, search Reddit globally + top crypto subreddits
        const fetchPromises = [];

        // Reduce overhead: Just search the combined query on global + 2 top subs
        const primaryQuery = encodeURIComponent(keywords.slice(0, 4).join(" "));

        // Global Reddit search
        fetchPromises.push(
            fetchWithTimeout(`https://www.reddit.com/search.json?q=${primaryQuery}&sort=relevance&t=month&limit=4`, {
                headers: { 'User-Agent': 'ProofFlow/1.0' }
            }, 4000).then(r => r.ok ? r.json() : null)
                .then(data => data?.data?.children?.map(c => c.data) || [])
                .catch(() => [])
        );

        // Targeted crypto search
        for (const sub of subreddits.slice(0, 2)) {
            fetchPromises.push(
                fetchWithTimeout(`https://www.reddit.com/r/${sub}/search.json?q=${primaryQuery}&sort=relevance&t=month&limit=3&restrict_sr=on`, {
                    headers: { 'User-Agent': 'ProofFlow/1.0' }
                }, 4000).then(r => r.ok ? r.json() : null)
                    .then(data => data?.data?.children?.map(c => c.data) || [])
                    .catch(() => [])
            );
        }

        const results = await Promise.allSettled(fetchPromises);
        for (const result of results) {
            if (result.status === "fulfilled" && Array.isArray(result.value)) {
                allPosts.push(...result.value);
            }
        }

        // Deduplicate by title, sort by relevance (score * comments), take top 6
        const seen = new Set();
        return allPosts
            .filter(p => {
                if (!p || !p.title || seen.has(p.title)) return false;
                seen.add(p.title);
                return true;
            })
            .sort((a, b) => ((b.score || 0) * Math.log2((b.num_comments || 1) + 1)) - ((a.score || 0) * Math.log2((a.num_comments || 1) + 1)))
            .slice(0, 6)
            .map(post => ({
                title: post.title,
                subreddit: post.subreddit_name_prefixed,
                score: post.score,
                comments: post.num_comments,
                url: `https://reddit.com${post.permalink}`,
                created: new Date(post.created_utc * 1000).toISOString().split('T')[0],
                selftext: post.selftext?.substring(0, 300) || "",
            }));
    } catch (error) {
        console.error("[MarketData] Reddit error:", error.message);
        return null;
    }
}

/**
 * Fetches trending coins from CoinGecko (what people are searching for right now).
 */
async function fetchCoinGeckoTrending() {
    try {
        const url = `${COINGECKO_BASE}/search/trending`;
        const response = await fetchWithTimeout(url);
        if (!response.ok) return null;

        const data = await response.json();
        return data.coins?.slice(0, 7).map(c => ({
            name: c.item.name,
            symbol: c.item.symbol,
            marketCapRank: c.item.market_cap_rank,
            priceChange24h: c.item.data?.price_change_percentage_24h?.usd,
            priceBtc: c.item.price_btc,
        })) || null;
    } catch (error) {
        console.error("[MarketData] CoinGecko trending error:", error.message);
        return null;
    }
}

// ─── MAIN ENRICHMENT ENGINE ─────────────────────────────────────────────────────

export async function enrichQuestionWithMarketData(question) {
    const { intents, isGeneralKnowledge } = classifyQuestion(question);

    console.log(`[MarketData] Classification: ${isGeneralKnowledge ? "GENERAL (no API calls)" : intents.join(", ")}`);

    // If it's a general knowledge question (cooking, history, etc.), skip ALL APIs
    if (isGeneralKnowledge) {
        return { enrichedPrompt: question, sources: [] };
    }

    const sources = [];
    const fetchPromises = [];
    let contextBlock = "\n\n--- LIVE MARKET DATA (fetched in real-time, use this for your analysis) ---\n";

    const detectedTokens = detectTokens(question);
    const detectedProtocols = detectProtocols(question);

    // ─── CRYPTO_PRICE intent → CoinGecko + DexScreener ──────────────────────
    if (intents.includes("CRYPTO_PRICE") || intents.includes("HEDERA_ECOSYSTEM")) {
        if (detectedTokens.length > 0) {
            fetchPromises.push(
                fetchCoinGeckoData(detectedTokens).then(data => {
                    if (data && data.length > 0) {
                        sources.push("CoinGecko API");
                        contextBlock += "\n📊 CoinGecko Market Data:\n";
                        for (const coin of data) {
                            contextBlock += `\n${coin.name} (${coin.symbol}):`;
                            contextBlock += `\n  Price: $${coin.price} | MCap: $${coin.marketCap?.toLocaleString()} | Vol 24h: $${coin.volume24h?.toLocaleString()}`;
                            contextBlock += `\n  1h: ${coin.change1h?.toFixed(2)}% | 24h: ${coin.change24h?.toFixed(2)}% | 7d: ${coin.change7d?.toFixed(2)}%`;
                            contextBlock += `\n  ATH: $${coin.ath} (${coin.athChangePercent?.toFixed(1)}% from ATH) | Supply: ${coin.circulatingSupply?.toLocaleString()}`;
                        }
                    }
                })
            );

            // DexScreener for the primary token
            const primarySymbol = detectedTokens[0] === "hedera-hashgraph" ? "HBAR" : detectedTokens[0];
            fetchPromises.push(
                fetchDexScreenerData(primarySymbol).then(data => {
                    if (data && data.length > 0) {
                        sources.push("DexScreener API");
                        contextBlock += "\n\n📈 DexScreener Top Pairs:\n";
                        for (const pair of data) {
                            contextBlock += `  ${pair.baseToken}/${pair.quoteToken} on ${pair.dex} (${pair.chain}): $${pair.priceUsd} | Vol: $${pair.volume24h?.toLocaleString()} | Liq: $${pair.liquidity?.toLocaleString()} | 24h: ${pair.priceChange24h}%\n`;
                        }
                    }
                })
            );
        }
    }

    // ─── DEFI intent → DefiLlama ────────────────────────────────────────────
    if (intents.includes("DEFI")) {
        // Fetch specific protocol data
        for (const slug of detectedProtocols) {
            fetchPromises.push(
                fetchDefiLlamaProtocol(slug).then(data => {
                    if (data) {
                        if (!sources.includes("DefiLlama API")) sources.push("DefiLlama API");
                        contextBlock += `\n\n🏦 DefiLlama — ${data.name} (${data.symbol || 'N/A'}):\n`;
                        contextBlock += `  Category: ${data.category} | TVL: $${data.tvl?.toLocaleString()}\n`;
                        contextBlock += `  TVL Change: 1d: ${data.change1d?.toFixed(2)}% | 7d: ${data.change7d?.toFixed(2)}% | 1m: ${data.change1m?.toFixed(2)}%\n`;
                        contextBlock += `  Chains: ${data.chains?.join(", ")}\n`;
                    }
                })
            );
        }

        // Fetch chain TVL for ANY detected blockchain chain
        const detectedChainNames = detectChains(question);
        for (const chainName of detectedChainNames) {
            fetchPromises.push(
                fetchDefiLlamaChainTVL(chainName).then(data => {
                    if (data) {
                        if (!sources.includes("DefiLlama API")) sources.push("DefiLlama API");
                        contextBlock += `\n\n🌐 ${data.name} DeFi Ecosystem (DefiLlama):\n`;
                        contextBlock += `  Total Chain TVL: $${data.tvl?.toLocaleString()}\n`;
                    }
                })
            );
        }

        // If no chains detected but DEFI intent is active, fetch top chains overview
        if (detectedChainNames.length === 0 && detectedProtocols.length === 0) {
            fetchPromises.push(
                (async () => {
                    try {
                        const url = `${DEFILLAMA_BASE}/v2/chains`;
                        const response = await fetch(url);
                        if (!response.ok) return;

                        const data = await response.json();
                        const topChains = data.sort((a, b) => b.tvl - a.tvl).slice(0, 10);
                        if (!sources.includes("DefiLlama API")) sources.push("DefiLlama API");
                        contextBlock += `\n\n🌐 Top 10 Chains by TVL (DefiLlama):\n`;
                        for (const c of topChains) {
                            contextBlock += `  ${c.name}: $${c.tvl?.toLocaleString()}\n`;
                        }
                    } catch (err) {
                        console.error("[MarketData] DefiLlama top chains error:", err.message);
                    }
                })()
            );
        }
    }

    // ─── SENTIMENT intent → Fear & Greed Index ──────────────────────────────
    if (intents.includes("SENTIMENT") || intents.includes("CRYPTO_PRICE")) {
        fetchPromises.push(
            fetchFearGreedIndex().then(data => {
                if (data && data.length > 0) {
                    sources.push("Fear & Greed Index");
                    contextBlock += "\n\n🧠 Crypto Fear & Greed Index (7-day trend):\n";
                    for (const d of data) {
                        contextBlock += `  ${d.timestamp}: ${d.value}/100 — ${d.classification}\n`;
                    }
                }
            })
        );
    }

    // ─── HEDERA ecosystem → Mirror Node ─────────────────────────────────────
    if (intents.includes("HEDERA_ECOSYSTEM")) {
        fetchPromises.push(
            fetchHederaNetworkStats().then(data => {
                if (data) {
                    sources.push("Hedera Mirror Node");
                    contextBlock += `\n\n🌐 Hedera Network Supply:\n`;
                    contextBlock += `  Total: ${data.totalSupply} | Released: ${data.releasedSupply}\n`;
                }
            })
        );
    }

    // ─── NEWS_SOCIAL intent → Reddit + CoinGecko Trending ───────────────────
    if (intents.includes("NEWS_SOCIAL")) {
        // Search Reddit for recent discussions about the topic
        fetchPromises.push(
            fetchRedditPosts(question).then(posts => {
                if (posts && posts.length > 0) {
                    sources.push("Reddit");
                    contextBlock += "\n\n💬 Reddit Community Discussions (past week):\n";
                    for (const post of posts) {
                        contextBlock += `\n  [${post.subreddit}] "${post.title}"\n`;
                        contextBlock += `    ↑${post.score} votes | ${post.comments} comments | ${post.created}\n`;
                        if (post.selftext) {
                            contextBlock += `    Preview: ${post.selftext}...\n`;
                        }
                    }
                }
            })
        );

        // Also fetch what's trending on CoinGecko right now
        fetchPromises.push(
            fetchCoinGeckoTrending().then(data => {
                if (data && data.length > 0) {
                    sources.push("CoinGecko Trending");
                    contextBlock += "\n\n🔥 CoinGecko Trending (most searched right now):\n";
                    for (const coin of data) {
                        contextBlock += `  #${coin.marketCapRank || '?'} ${coin.name} (${coin.symbol})${coin.priceChange24h ? ` — 24h: ${coin.priceChange24h.toFixed(2)}%` : ''}\n`;
                    }
                }
            })
        );
    }

    // Execute all relevant fetches in parallel
    await Promise.allSettled(fetchPromises);

    if (sources.length === 0) {
        return { enrichedPrompt: question, sources: [] };
    }

    contextBlock += `\n--- END LIVE DATA (Sources: ${sources.join(", ")}) ---\n`;
    contextBlock += `\nIMPORTANT: Base your analysis on the LIVE DATA above. Cite specific numbers and mention the data source.\n`;

    return { enrichedPrompt: question + contextBlock, sources };
}
