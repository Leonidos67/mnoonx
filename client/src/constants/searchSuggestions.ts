/** Fallback when API is empty or unavailable (seed-style crypto personas). */
export const FALLBACK_POPULAR_PEOPLE = [
  { username: 'cryptoalpha', fullName: 'Crypto Alpha' },
  { username: 'btc_oracle_ru', fullName: 'BTC Oracle RU' },
  { username: 'defi_chad', fullName: 'DeFi Chad' },
  { username: 'solwhale_io', fullName: 'SOL Whale' },
  { username: 'onchain_anna', fullName: 'Onchain Anna' },
  { username: 'altseason_io', fullName: 'Altseason.io' },
];

export function personAvatarUrl(fullName: string, size = 64) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=111827&color=fff&size=${size}&bold=true`;
}

export function communityAvatarUrl(name: string, size = 64) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a5f&color=fff&size=${size}&bold=true`;
}
