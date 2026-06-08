const TONAPI_BASE = 'https://tonapi.io/v2';
const TON_COIN_ID = 'the-open-network';

/** Known TON jetton symbols → CoinGecko id */
const JETTON_SYMBOL_TO_COINGECKO = {
  USDT: 'tether',
  'USD₮': 'tether',
  USDt: 'tether',
  USDC: 'usd-coin',
  NOT: 'notcoin',
  STON: 'ston-fi',
  SCALE: 'scaleton',
  tsTON: 'tonstakers',
  jUSDT: 'tether',
  jUSDC: 'usd-coin',
};

function tonapiHeaders() {
  const key = process.env.TONAPI_KEY || process.env.TON_API_KEY;
  return key ? { Authorization: `Bearer ${key}`, Accept: 'application/json' } : { Accept: 'application/json' };
}

function isTonAddress(address) {
  const a = String(address || '').trim();
  if (/^(UQ|EQ|kQ)[A-Za-z0-9_-]{46}$/.test(a)) return true;
  if (/^-?\d+:[a-fA-F0-9]{64}$/i.test(a)) return true;
  return false;
}

function normalizeAddress(address) {
  return String(address || '').trim();
}

function encodeAccountId(address) {
  return encodeURIComponent(normalizeAddress(address));
}

async function tonapiGet(path) {
  const res = await fetch(`${TONAPI_BASE}${path}`, { headers: tonapiHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`TonAPI ${res.status}`);
    err.status = res.status === 404 ? 400 : res.status >= 500 ? 502 : 400;
    err.body = text;
    throw err;
  }
  return res.json();
}

function nanotonToTon(nano) {
  const n = BigInt(String(nano || '0'));
  return Number(n) / 1e9;
}

function jettonAmount(balance, decimals) {
  const dec = Number(decimals) || 9;
  const raw = BigInt(String(balance || '0'));
  return Number(raw) / 10 ** dec;
}

function resolveJettonCoinId(jetton, masterAddress) {
  const symbol = String(jetton?.symbol || '').trim();
  if (symbol && JETTON_SYMBOL_TO_COINGECKO[symbol]) {
    return JETTON_SYMBOL_TO_COINGECKO[symbol];
  }
  const upper = symbol.toUpperCase();
  if (JETTON_SYMBOL_TO_COINGECKO[upper]) return JETTON_SYMBOL_TO_COINGECKO[upper];
  return `ton-jetton-${(masterAddress || '').replace(/:/g, '_')}`;
}

function extractUsdPrice(jettonBalance) {
  const p = jettonBalance?.price?.prices?.USD ?? jettonBalance?.price?.usd ?? null;
  return p != null && Number(p) > 0 ? Number(p) : null;
}

async function fetchTonWalletBalances(address) {
  const raw = normalizeAddress(address);
  if (!isTonAddress(raw)) {
    const err = new Error('Invalid TON wallet address');
    err.status = 400;
    throw err;
  }

  const encoded = encodeAccountId(raw);
  const [account, jettonsData] = await Promise.all([
    tonapiGet(`/accounts/${encoded}`),
    tonapiGet(`/accounts/${encoded}/jettons`).catch(() => ({ balances: [] })),
  ]);

  const addrField = account?.address;
  const friendlyAddress =
    typeof addrField === 'string'
      ? addrField
      : addrField?.address || account?.address?.raw_form || raw;
  const holdings = [];

  const tonAmount = nanotonToTon(account?.balance);
  if (tonAmount > 0) {
    holdings.push({
      coinId: TON_COIN_ID,
      symbol: 'TON',
      name: 'Toncoin',
      amount: tonAmount,
      contractAddress: '',
      chain: 'ton',
      livePriceUsd: null,
      image: null,
    });
  }

  const jettonBalances = Array.isArray(jettonsData?.balances) ? jettonsData.balances : [];
  for (const row of jettonBalances.slice(0, 50)) {
    const jetton = row?.jetton || {};
    const master =
      jetton?.address ||
      row?.jetton?.address ||
      row?.wallet_address?.address ||
      '';
    const masterStr = typeof master === 'string' ? master : master?.address || '';
    const amount = jettonAmount(row?.balance, jetton?.decimals);
    if (!amount || amount <= 0) continue;

    const symbol = String(jetton.symbol || 'JETTON').trim();
    const name = String(jetton.name || symbol).trim();
    holdings.push({
      coinId: resolveJettonCoinId(jetton, masterStr),
      symbol: symbol.toUpperCase().slice(0, 12),
      name,
      amount,
      contractAddress: masterStr,
      chain: 'ton',
      livePriceUsd: extractUsdPrice(row),
      image: jetton.image || null,
    });
  }

  return { friendlyAddress, holdings };
}

async function fetchWalletBalances(address, chainKey = 'ton') {
  if (chainKey && chainKey !== 'ton') {
    const err = new Error('Only TON network is supported');
    err.status = 400;
    throw err;
  }
  const { holdings } = await fetchTonWalletBalances(address);
  return holdings;
}

function getSupportedNetworks() {
  return [{ id: 'ton', label: 'TON', nativeSymbol: 'TON' }];
}

module.exports = {
  isTonAddress,
  normalizeAddress,
  fetchWalletBalances,
  fetchTonWalletBalances,
  getSupportedNetworks,
  TON_COIN_ID,
};
