/**
 * Generate unique bulk community member personas (crypto / web3 themed).
 * @param {number} count
 * @returns {{ username: string; email: string; fullName: string; bio: string; avatar: string }[]}
 */
function generateBulkPersonas(count, emailDomain = 'bulk.seed.mnoonx.dev') {
  const firstNames = [
    'Alex', 'Maria', 'Dmitry', 'Sofia', 'Kenji', 'Priya', 'Marcus', 'Elena', 'Lucas', 'Yuki',
    'Omar', 'Fatima', 'Noah', 'Chloe', 'Ivan', 'Nadia', 'Leo', 'Amira', 'Felix', 'Zara',
    'Ethan', 'Mila', 'Arjun', 'Hana', 'Victor', 'Ines', 'Theo', 'Layla', 'Oscar', 'Nina',
    'Adrian', 'Klara', 'Mateo', 'Aisha', 'Roman', 'Eva', 'Jonas', 'Maya', 'Pavel', 'Daria',
    'Hugo', 'Sara', 'Nikita', 'Yana', 'Emil', 'Tara', 'Sven', 'Lina', 'Ravi', 'Mei',
    'Andrei', 'Polina', 'Carlos', 'Rosa', 'Henrik', 'Freya', 'Idris', 'Noor', 'Stefan', 'Vera',
    'Tomas', 'Anya', 'Diego', 'Camila', 'Lars', 'Helena', 'Raj', 'Suki', 'Marko', 'Irina',
    'Finn', 'Zoe', 'Kaito', 'Rina', 'Boris', 'Alina', 'Cole', 'Jade', 'Marek', 'Tanya',
    'Quinn', 'Nora', 'Sergei', 'Katya', 'Bruno', 'Elise', 'Viktor', 'Oksana', 'Nico', 'Luna',
    'Artem', 'Galina', 'Enzo', 'Bianca', 'Timur', 'Svetlana', 'Joel', 'Amber', 'Denis', 'Vika',
  ];

  const lastNames = [
    'Rivera', 'Volkov', 'Chen', 'Nakamura', 'Petrov', 'Silva', 'Kim', 'Okonkwo', 'Bauer', 'Larsen',
    'Morozov', 'Patel', 'Schmidt', 'Dubois', 'Kowalski', 'Novak', 'Ali', 'Santos', 'Ivanov', 'Nguyen',
    'Fischer', 'Moreau', 'Kuznetsov', 'Tanaka', 'Garcia', 'Rossi', 'Andersen', 'Hassan', 'Wright', 'Popov',
    'Sato', 'Khan', 'Müller', 'Leclerc', 'Orlov', 'Reyes', 'Johansson', 'Abbas', 'Stone', 'Volkova',
    'Ito', 'Sharma', 'Weber', 'Martin', 'Sokolov', 'Lopez', 'Berg', 'Farah', 'Coleman', 'Smirnov',
    'Yamamoto', 'Das', 'Hoffman', 'Bernard', 'Fedorov', 'Torres', 'Holm', 'Rahman', 'Brooks', 'Kozlov',
    'Watanabe', 'Iyer', 'Keller', 'Girard', 'Belov', 'Mendez', 'Lind', 'Saleh', 'Hayes', 'Romanov',
  ];

  const topics = [
    'whale', 'alpha', 'scout', 'oracle', 'hunter', 'maxi', 'sage', 'degen', 'flows', 'perps',
    'macro', 'layer2', 'memecoin', 'airdrop', 'staking', 'yield', 'bridge', 'funding', 'stable', 'nft',
    'solana', 'ethereum', 'bitcoin', 'toncoin', 'arbitrum', 'base', 'polygon', 'cosmos', 'sui', 'aptos',
    'chart', 'signals', 'trades', 'journal', 'research', 'onchain', 'defi', 'perp', 'spot', 'swing',
    'scalp', 'hodl', 'farm', 'vault', 'liquidity', 'volume', 'momentum', 'rekt', 'moon', 'dip',
  ];

  const flavors = [
    'io', 'ru', 'labs', 'dao', 'hub', 'daily', 'watch', 'desk', 'crew', 'club',
    'zone', 'wire', 'feed', 'pulse', 'stack', 'grid', 'node', 'byte', 'flux', 'wave',
  ];

  const bios = [
    'Swing trades · BTC & majors · journal only.',
    'On-chain flows and exchange reserves.',
    'DeFi yields, LP risk, smart contract notes.',
    'Memecoin narratives on SOL & ETH. NFA.',
    'Perp funding, OI, liquidation maps.',
    'Macro, rates, DXY — risk-on / risk-off.',
    'L2 fees, bridges, ecosystem rotations.',
    'Airdrop checkpoints & eligibility threads.',
    'Technical levels & market structure. NFA.',
    'Solana ecosystem scans & volume watch.',
    'ETH staking, restaking, LRT flows.',
    'Stablecoin mints, depeg risk, reserves.',
    'NFT floors, collections, mint calendars.',
    'Base & Arbitrum app discovery.',
    'Свинг по BTC и мажорам. Дневник сделок.',
    'Потоки, резервы бирж, стейблкоины.',
    'DeFi, доходность, риски контрактов.',
    'Мемкоины и деген на Solana.',
    'Макро и риск. Комментарии на русском.',
    'Теханализ без финансовых советов.',
    'TON ecosystem & jetton liquidity.',
    'Cross-chain bridge activity watcher.',
    'Altcoin breadth & sector rotation.',
    'Options skew & implied vol notes.',
    'Token unlocks & vesting calendar.',
  ];

  const used = new Set();
  const personas = [];

  const slug = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 30);

  const pickBio = (i) => bios[i % bios.length];

  const tryAdd = (username, fullName, bioIndex) => {
    const u = slug(username);
    if (u.length < 3 || u.length > 30) return false;
    if (used.has(u)) return false;
    used.add(u);
    personas.push({
      username: u,
      email: `${u}@${emailDomain}`,
      fullName,
      bio: pickBio(bioIndex),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=315efb&color=fff&size=128&bold=true`,
    });
    return true;
  };

  let bioIdx = 0;

  // Real names: first_last
  for (const first of firstNames) {
    for (const last of lastNames) {
      if (personas.length >= count) break;
      const f = first.toLowerCase();
      const l = last.toLowerCase().slice(0, 12);
      if (tryAdd(`${f}_${l}`, `${first} ${last}`, bioIdx++)) continue;
      if (personas.length >= count) break;
      tryAdd(`${f}${l.slice(0, 4)}`, `${first} ${last}`, bioIdx++);
    }
    if (personas.length >= count) break;
  }

  // Crypto handles: topic_first, first_topic, onchain_first
  for (const first of firstNames) {
    for (const topic of topics) {
      if (personas.length >= count) break;
      const f = first.toLowerCase();
      if (tryAdd(`${topic}_${f}`, `${first} · ${topic}`, bioIdx++)) continue;
      if (personas.length >= count) break;
      if (tryAdd(`${f}_${topic}`, `${topic} ${first}`, bioIdx++)) continue;
      if (personas.length >= count) break;
      tryAdd(`onchain_${f}`, `Onchain ${first}`, bioIdx++);
    }
    if (personas.length >= count) break;
  }

  // topic + flavor combos
  for (const topic of topics) {
    for (const flavor of flavors) {
      if (personas.length >= count) break;
      const label = `${topic.charAt(0).toUpperCase() + topic.slice(1)} ${flavor.toUpperCase()}`;
      tryAdd(`${topic}_${flavor}`, label, bioIdx++);
    }
    if (personas.length >= count) break;
  }

  // first + trades / charts / signals
  const suffixes = ['trades', 'charts', 'signals', 'alpha', 'scout', 'desk', 'watch'];
  for (const first of firstNames) {
    for (const suffix of suffixes) {
      if (personas.length >= count) break;
      tryAdd(`${first.toLowerCase()}_${suffix}`, `${first} ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`, bioIdx++);
    }
    if (personas.length >= count) break;
  }

  // Fallback: natural-looking numeric suffix (not user001)
  let n = 7;
  while (personas.length < count) {
    const first = firstNames[n % firstNames.length];
    const topic = topics[(n * 3) % topics.length];
    const suffix = 10 + (n % 90);
    tryAdd(`${first.toLowerCase()}_${topic}${suffix}`, `${first} ${topic}`, bioIdx++);
    n += 1;
    if (n > count * 20) break;
  }

  if (personas.length < count) {
    throw new Error(`Could only generate ${personas.length} unique personas (need ${count})`);
  }

  return personas.slice(0, count);
}

module.exports = { generateBulkPersonas };
