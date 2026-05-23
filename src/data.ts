/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, Sticker, TradeOffer, CollectionState } from './types';

export const TEAMS: Team[] = [
  // Group A
  { name: "Mexico", code: "MEX", group: "Group A", flagEmoji: "🇲🇽", fedName: "Federación Mexicana de Fútbol" },
  { name: "Czechia", code: "CZE", group: "Group A", flagEmoji: "🇨🇿", fedName: "Fotbalová asociace České republiky" },
  { name: "Korea Republic", code: "KOR", group: "Group A", flagEmoji: "🇰🇷", fedName: "Korea Football Association" },
  { name: "South Africa", code: "RSA", group: "Group A", flagEmoji: "🇿🇦", fedName: "South African Football Association" },

  // Group B
  { name: "Canada", code: "CAN", group: "Group B", flagEmoji: "🇨🇦", fedName: "Canada Soccer Association" },
  { name: "Qatar", code: "QAT", group: "Group B", flagEmoji: "🇶🇦", fedName: "Qatar Football Association" },
  { name: "Switzerland", code: "SUI", group: "Group B", flagEmoji: "🇨🇭", fedName: "Association Suisse de Football" },
  { name: "Bosnia & Herzegovina", code: "BIH", group: "Group B", flagEmoji: "🇧🇦", fedName: "Nogometni Savez Bosne i Hercegovine" },

  // Group C
  { name: "Brazil", code: "BRA", group: "Group C", flagEmoji: "🇧🇷", fedName: "Confederação Brasileira de Futebol" },
  { name: "Morocco", code: "MAR", group: "Group C", flagEmoji: "🇲🇦", fedName: "Fédération Royale Marocaine de Football" },
  { name: "Haiti", code: "HAI", group: "Group C", flagEmoji: "🇭🇹", fedName: "Fédération Haïtienne de Football" },
  { name: "Scotland", code: "SCO", group: "Group C", flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", fedName: "Scottish Football Association" },

  // Group D
  { name: "United States", code: "USA", group: "Group D", flagEmoji: "🇺🇸", fedName: "United States Soccer Federation" },
  { name: "Paraguay", code: "PAR", group: "Group D", flagEmoji: "🇵🇾", fedName: "Asociación Paraguaya de Fútbol" },
  { name: "Australia", code: "AUS", group: "Group D", flagEmoji: "🇦🇺", fedName: "Football Australia" },
  { name: "Türkiye", code: "TUR", group: "Group D", flagEmoji: "🇹🇷", fedName: "Türkiye Futbol Federasyonu" },

  // Group E
  { name: "Germany", code: "GER", group: "Group E", flagEmoji: "🇩🇪", fedName: "Deutscher Fußball-Bund" },
  { name: "Curaçao", code: "CUW", group: "Group E", flagEmoji: "🇨🇼", fedName: "Federashon Futbol Korsou" },
  { name: "Ivory Coast", code: "CIV", group: "Group E", flagEmoji: "🇨🇮", fedName: "Fédération Ivoirienne de Football" },
  { name: "Ecuador", code: "ECU", group: "Group E", flagEmoji: "🇪🇨", fedName: "Federación Ecuatoriana de Fútbol" },

  // Group F
  { name: "Netherlands", code: "NED", group: "Group F", flagEmoji: "🇳🇱", fedName: "Koninklijke Nederlandse Voetbalbond" },
  { name: "Japan", code: "JPN", group: "Group F", flagEmoji: "🇯🇵", fedName: "Japan Football Association" },
  { name: "Tunisia", code: "TUN", group: "Group F", flagEmoji: "🇹🇳", fedName: "Fédération Tunisienne de Football" },
  { name: "Sweden", code: "SWE", group: "Group F", flagEmoji: "🇸🇪", fedName: "Svenska Fotbollförbundet" },

  // Group G
  { name: "Belgium", code: "BEL", group: "Group G", flagEmoji: "🇧🇪", fedName: "Royal Belgian Football Association" },
  { name: "Egypt", code: "EGY", group: "Group G", flagEmoji: "🇪🇬", fedName: "Egyptian Football Association" },
  { name: "Iran", code: "IRN", group: "Group G", flagEmoji: "🇮🇷", fedName: "Football Federation Islamic Republic of Iran" },
  { name: "New Zealand", code: "NZL", group: "Group G", flagEmoji: "🇳🇿", fedName: "New Zealand Football" },

  // Group H
  { name: "Spain", code: "ESP", group: "Group H", flagEmoji: "🇪🇸", fedName: "Real Federación Española de Fútbol" },
  { name: "Saudi Arabia", code: "KSA", group: "Group H", flagEmoji: "🇸🇦", fedName: "Saudi Arabian Football Federation" },
  { name: "Cape Verde", code: "CPV", group: "Group H", flagEmoji: "🇨🇻", fedName: "Federação Caboverdiana de Futebol" },
  { name: "Uruguay", code: "URU", group: "Group H", flagEmoji: "🇺🇾", fedName: "Asociación Uruguaya de Fútbol" },

  // Group I
  { name: "France", code: "FRA", group: "Group I", flagEmoji: "🇫🇷", fedName: "Fédération Française de Football" },
  { name: "Senegal", code: "SEN", group: "Group I", flagEmoji: "🇸🇳", fedName: "Fédération Sénégalaise de Football" },
  { name: "Iraq", code: "IRQ", group: "Group I", flagEmoji: "🇮🇶", fedName: "Iraq Football Association" },
  { name: "Norway", code: "NOR", group: "Group I", flagEmoji: "🇳🇴", fedName: "Norges Fotballforbund" },

  // Group J
  { name: "Argentina", code: "ARG", group: "Group J", flagEmoji: "🇦🇷", fedName: "Asociación del Fútbol Argentino" },
  { name: "Algeria", code: "ALG", group: "Group J", flagEmoji: "🇩🇿", fedName: "Fédération Algérienne de Football" },
  { name: "Austria", code: "AUT", group: "Group J", flagEmoji: "🇦🇹", fedName: "Österreichischer Fußball-Bund" },
  { name: "Jordan", code: "JOR", group: "Group J", flagEmoji: "🇯🇴", fedName: "Jordan Football Association" },

  // Group K
  { name: "Portugal", code: "POR", group: "Group K", flagEmoji: "🇵🇹", fedName: "Federação Portuguesa de Futebol" },
  { name: "Colombia", code: "COL", group: "Group K", flagEmoji: "🇨🇴", fedName: "Federación Colombiana de Fútbol" },
  { name: "Uzbekistan", code: "UZB", group: "Group K", flagEmoji: "🇺🇿", fedName: "Uzbekistan Football Association" },
  { name: "DR Congo", code: "COD", group: "Group K", flagEmoji: "🇨🇩", fedName: "Fédération Congolaise de Football-Association" },

  // Group L
  { name: "England", code: "ENG", group: "Group L", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", fedName: "The Football Association" },
  { name: "Croatia", code: "CRO", group: "Group L", flagEmoji: "🇭🇷", fedName: "Hrvatski nogometni savez" },
  { name: "Ghana", code: "GHA", group: "Group L", flagEmoji: "🇬🇭", fedName: "Ghana Football Association" },
  { name: "Panama", code: "PAN", group: "Group L", flagEmoji: "🇵🇦", fedName: "Federación Panameña de Fútbol" }
];

// Seeded generator of football player names to make placeholders beautiful
export function getPlayerName(teamCode: string, num: number): string {
  if (num === 1) return "Federation Emblem";
  if (num === 13) return "Team Photo";

  const rosters: { [code: string]: { [n: number]: string } } = {
    MEX: {
      2: "Guillermo Ochoa",
      3: "César Montes",
      4: "Johan Vásquez",
      5: "Jesús Gallardo",
      6: "Edson Álvarez",
      7: "Héctor Herrera",
      8: "Luis Chávez",
      9: "Hirving Lozano",
      10: "Santiago Giménez",
      11: "Henry Martín",
      12: "Uriel Antuna",
      14: "Duván Sánchez",
      15: "Orbelín Pineda",
      16: "Carlos Rodríguez",
      17: "Luis Romo",
      18: "Erick Sánchez",
      19: "César Huerta",
      20: "Alexis Vega"
    },
    ARG: {
      2: "Emiliano Martínez",
      3: "Nahuel Molina",
      4: "Cristian Romero",
      5: "Nicolás Otamendi",
      6: "Nicolás Tagliafico",
      7: "Rodrigo de Paul",
      8: "Enzo Fernández",
      9: "Alexis Mac Allister",
      10: "Lionel Messi",
      11: "Ángel Di María",
      12: "Julián Álvarez",
      14: "Lautaro Martínez",
      15: "Marcos Acuña",
      16: "Gonzalo Montiel",
      17: "Lisandro Martínez",
      18: "Exequiel Palacios",
      19: "Leandro Paredes",
      20: "Alejandro Garnacho"
    },
    USA: {
      2: "Matt Turner",
      3: "Sergiño Dest",
      4: "Walker Zimmerman",
      5: "Tim Ream",
      6: "Antonee Robinson",
      7: "Tyler Adams",
      8: "Yunus Musah",
      9: "Weston McKennie",
      10: "Christian Pulisic",
      11: "Timothy Weah",
      12: "Folarin Balogun",
      14: "Ricardo Pepi",
      15: "Gio Reyna",
      16: "Brenden Aaronson",
      17: "Miles Robinson",
      18: "Joe Scally",
      19: "Luca de la Torre",
      20: "Malik Tillman"
    },
    BRA: {
      2: "Alisson Becker",
      3: "Danilo da Silva",
      4: "Marquinhos",
      5: "Gabriel Magalhães",
      6: "Guilherme Arana",
      7: "Bruno Guimarães",
      8: "Douglas Luiz",
      9: "Lucas Paquetá",
      10: "Neymar Jr",
      11: "Rodrygo Goes",
      12: "Vinícius Júnior",
      14: "Raphinha",
      15: "Endrick",
      16: "Éder Militão",
      17: "Andreas Pereira",
      18: "Gabriel Martinelli",
      19: "Savinho",
      20: "Ederson Moraes"
    },
    FRA: {
      2: "Mike Maignan",
      3: "Jules Koundé",
      4: "Dayot Upamecano",
      5: "William Saliba",
      6: "Théo Hernandez",
      7: "Aurélien Tchouaméni",
      8: "N'Golo Kanté",
      9: "Antoine Griezmann",
      10: "Kylian Mbappé",
      11: "Ousmane Dembélé",
      12: "Marcus Thuram",
      14: "Olivier Giroud",
      15: "Eduardo Camavinga",
      16: "Adrien Rabiot",
      17: "Kingsley Coman",
      18: "Randal Kolo Muani",
      19: "Ibrahima Konaté",
      20: "Benjamin Pavard"
    },
    ENG: {
      2: "Jordan Pickford",
      3: "Kyle Walker",
      4: "John Stones",
      5: "Marc Guéhi",
      6: "Kieran Trippier",
      7: "Declan Rice",
      8: "Kobbie Mainoo",
      9: "Jude Bellingham",
      10: "Bukayo Saka",
      11: "Phil Foden",
      12: "Harry Kane",
      14: "Cole Palmer",
      15: "Ollie Watkins",
      16: "Trent Alexander-Arnold",
      17: "Conor Gallagher",
      18: "Ezri Konsa",
      19: "Anthony Gordon",
      20: "Ivan Toney"
    },
    POR: {
      2: "Diogo Costa",
      3: "João Cancelo",
      4: "Rúben Dias",
      5: "Pepe",
      6: "Nuno Mendes",
      7: "João Palhinha",
      8: "Vitinha",
      9: "Bruno Fernandes",
      10: "Bernardo Silva",
      11: "Rafael Leão",
      12: "Cristiano Ronaldo",
      14: "Diogo Jota",
      15: "Gonçalo Ramos",
      16: "João Félix",
      17: "Francisco Conceição",
      18: "Danilo Pereira",
      19: "Nélson Semedo",
      20: "Gonçalo Inácio"
    },
    GER: {
      2: "Manuel Neuer",
      3: "Joshua Kimmich",
      4: "Antonio Rüdiger",
      5: "Jonathan Tah",
      6: "David Raum",
      7: "Robert Andrich",
      8: "Toni Kroos",
      9: "İkay Gündoğan",
      10: "Jamal Musiala",
      11: "Florian Wirtz",
      12: "Kai Havertz",
      14: "Niclas Füllkrug",
      15: "Leroy Sané",
      16: "Thomas Müller",
      17: "Maximilian Mittelstädt",
      18: "Nico Schlotterbeck",
      19: "Pascal Groß",
      20: "Marc-André ter Stegen"
    }
  };

  // If specific roster exists, return it
  if (rosters[teamCode]?.[num]) {
    return rosters[teamCode][num];
  }

  // Otherwise generate generic beautiful athletic names based on seeds
  const firsts = [
    "Alex", "David", "Robert", "James", "Luka", "Thomas", "Paul", "Marc", "Christian", "Ivan",
    "Luis", "Carlos", "Julio", "Mateo", "Antoine", "Hugo", "Kevin", "Oliver", "Harry", "Lucas",
    "Sven", "Filip", "Miloš", "Tariq", "Hassan", "Yuki", "Jin", "Kofi", "Abdi", "Samuel",
    "Andrés", "Diego", "Enzo", "Gaston", "Sergi", "Frenkie", "Stefan", "Jan", "Andrej", "Youssef"
  ];
  const lasts = [
    "Smith", "Jones", "Ivanov", "Schmidt", "Müller", "Dubois", "Martin", "García", "Rodríguez", "Martínez",
    "Silva", "Santos", "Larsen", "Hansen", "Novák", "Kovács", "Takahashi", "Sato", "Kim", "Park",
    "Nkosi", "Dube", "Mensah", "Osei", "Ali", "Hassan", "Norheim", "Dahl", "Modrić", "Kovačić",
    "Barić", "Cech", "Varga", "Sosa", "Gomez", "Van Dijk", "De Jong", "Kroos", "Lahm", "Villa"
  ];

  // Stable random generation using teamCode + number as hash
  const hash = teamCode.charCodeAt(0) * 3 + teamCode.charCodeAt(1) * 7 + teamCode.charCodeAt(2) * 11 + num * 17;
  const first = firsts[hash % firsts.length];
  const last = lasts[(hash + num) % lasts.length];

  return `${first.charAt(0)}. ${last}`;
}

// Generates the static 980 sticker collection definition array
export function generateAllStickers(): Sticker[] {
  const stickers: Sticker[] = [];

  // 1. Sticker 00: Panini Logo
  stickers.push({
    id: "00",
    name: "Panini Logo",
    type: 'general',
    section: "Tournament Opening / General",
    number: 0,
    isShiny: true,
    position: 'Special'
  });

  // 2. FWC-1 to FWC-5: Tournament info
  const fwcNames: { [id: number]: string } = {
    1: "Official Emblem – Part 1",
    2: "Official Emblem – Part 2",
    3: "Official Mascots",
    4: "Official Slogan",
    5: "Official Ball"
  };

  for (let i = 1; i <= 5; i++) {
    stickers.push({
      id: `FWC-${i}`,
      name: fwcNames[i] || `Tournament Card ${i}`,
      type: 'general',
      section: "Tournament Opening / General",
      number: i,
      isShiny: true,
      position: 'Special'
    });
  }

  // 3. FWC-6 to FWC-8: Host countries
  const hostNames: { [id: number]: string } = {
    6: "Canada Host Logo",
    7: "Mexico Host Logo",
    8: "USA Host Logo"
  };

  for (let i = 6; i <= 8; i++) {
    stickers.push({
      id: `FWC-${i}`,
      name: hostNames[i] || `Host Logo ${i}`,
      type: 'general',
      section: "Tournament Host Countries",
      number: i,
      isShiny: true,
      position: 'Special'
    });
  }

  // 4. Team Sections: 48 teams × 20 stickers = 960 stickers
  for (const team of TEAMS) {
    for (let i = 1; i <= 20; i++) {
      let pos: 'Emblem' | 'GK' | 'DF' | 'MF' | 'FW' | 'Team Photo' = 'MF';
      if (i === 1) pos = 'Emblem';
      else if (i === 13) pos = 'Team Photo';
      else if (i === 2) pos = 'GK';
      else if ([3, 4, 5, 14, 15].includes(i)) pos = 'DF';
      else if ([6, 7, 8, 9, 16, 17].includes(i)) pos = 'MF';
      else pos = 'FW';

      stickers.push({
        id: `${team.code}-${i}`,
        name: getPlayerName(team.code, i),
        type: 'team',
        section: `${team.name} (${team.code})`,
        teamCode: team.code,
        number: i,
        isShiny: i === 1, // Only the emblem of the federation is metallic foil!
        position: pos
      });
    }
  }

  // 5. Historical Winners: FWC-9 to FWC-19
  const historicalNames: { [id: number]: string } = {
    9: "Italy 1934 Champion",
    10: "Uruguay 1950 Champion",
    11: "West Germany 1954 Champion",
    12: "Brazil 1962 Champion",
    13: "West Germany 1974 Champion",
    14: "Argentina 1986 Champion",
    15: "Brazil 1994 Champion",
    16: "Brazil 2002 Champion",
    17: "Italy 2006 Champion",
    18: "Germany 2014 Champion",
    19: "Argentina 2022 Champion"
  };

  for (let i = 9; i <= 19; i++) {
    stickers.push({
      id: `FWC-${i}`,
      name: historicalNames[i] || `Historical Champion FWC-${i}`,
      type: 'history',
      section: "FIFA World Cup History",
      number: i,
      isShiny: true, // Shiny golden historic badges
      position: 'Special'
    });
  }

  return stickers;
}

// Generate an initial empty collection state.
export function generateInitialCollectionState(): CollectionState {
  const allStickers = generateAllStickers();
  const counts: { [stickerId: string]: number } = {};

  // Initialize everything to 0
  for (const s of allStickers) {
    counts[s.id] = 0;
  }

  return {
    counts,
    photos: {}
  };
}

// Beautiful list of community trader profiles and listings to simulate active community matches
export const COMMUNITY_TRADERS: TradeOffer[] = [
  {
    id: "trade-1",
    traderName: "John (The Swap Master)",
    gives: ["FWC-7"], // Canada logo, FWC etc. Let's make it match what user might need
    wants: ["MEX-2", "ARG-10"], // G. Ochoa etc
    status: 'pending'
  },
  {
    id: "trade-2",
    traderName: "Alex88",
    gives: ["MEX-10"],
    wants: ["CAN-1"],
    status: 'pending'
  },
  {
    id: "trade-3",
    traderName: "KylianFan",
    gives: ["FRA-10"], // Kylian Mbappe! High value
    wants: ["ENG-12"], // Harry Kane
    status: 'pending'
  },
  {
    id: "trade-4",
    traderName: "ZizouLegend",
    gives: ["FWC-19"],
    wants: ["POR-12"],
    status: 'pending'
  }
];
