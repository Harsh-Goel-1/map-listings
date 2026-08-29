export interface NoidaLocationItem {
  id: string;
  name: string;
  secondary: string;
  lat: number;
  lng: number;
  radius: number; // in meters
}

// Curated coordinates for Noida sectors and prominent landmarks/societies
export const NOIDA_LOCATIONS: NoidaLocationItem[] = [
  // ── Commercial & Retail Hubs ──
  { id: 'sec-18', name: 'Sector 18 (Atta Market & Mall of India)', secondary: 'Noida, Uttar Pradesh', lat: 28.5705, lng: 77.3245, radius: 900 },
  { id: 'dlf-mall', name: 'DLF Mall of India', secondary: 'Sector 18, Noida', lat: 28.5678, lng: 77.3210, radius: 600 },
  { id: 'logix-cc', name: 'Logix City Centre', secondary: 'Sector 32, Noida', lat: 28.5742, lng: 77.3546, radius: 700 },
  { id: 'sec-62', name: 'Sector 62 (IT & Institutional Hub)', secondary: 'Noida, Uttar Pradesh', lat: 28.6273, lng: 77.3650, radius: 1400 },
  { id: 'sec-63', name: 'Sector 63 (Industrial Zone)', secondary: 'Noida, Uttar Pradesh', lat: 28.6250, lng: 77.3820, radius: 1400 },
  { id: 'advant-navis', name: 'Advant Navis Business Park', secondary: 'Sector 142, Noida Expressway', lat: 28.5020, lng: 77.4120, radius: 800 },
  { id: 'spectrum-metro', name: 'Spectrum Metro', secondary: 'Sector 75, Noida', lat: 28.5740, lng: 77.3750, radius: 650 },

  // ── Top Residential Sectors & Societies ──
  { id: 'sec-150', name: 'Sector 150 (Sports City & Green Belt)', secondary: 'Noida, Uttar Pradesh', lat: 28.4735, lng: 77.4870, radius: 1500 },
  { id: 'ats-pristine', name: 'ATS Pristine', secondary: 'Sector 150, Noida', lat: 28.4710, lng: 77.4890, radius: 600 },
  { id: 'ats-greens', name: 'ATS Greens', secondary: 'Sector 50 / 150, Noida', lat: 28.5690, lng: 77.4538, radius: 600 },
  { id: 'sec-137', name: 'Sector 137 (Expressway Residential)', secondary: 'Noida, Uttar Pradesh', lat: 28.5088, lng: 77.4085, radius: 1200 },
  { id: 'paras-tierea', name: 'Paras Tierea', secondary: 'Sector 137, Noida', lat: 28.5075, lng: 77.4060, radius: 600 },
  { id: 'sec-74', name: 'Sector 74', secondary: 'Noida, Uttar Pradesh', lat: 28.5725, lng: 77.3690, radius: 1000 },
  { id: 'supertech-capetown', name: 'Supertech Capetown', secondary: 'Sector 74, Noida', lat: 28.5725, lng: 77.3690, radius: 600 },
  { id: 'sec-75', name: 'Sector 75', secondary: 'Noida, Uttar Pradesh', lat: 28.5715, lng: 77.3730, radius: 1000 },
  { id: 'civitech-stadia', name: 'Civitech Stadia', secondary: 'Sector 75, Noida', lat: 28.5715, lng: 77.3730, radius: 600 },
  { id: 'sec-76', name: 'Sector 76', secondary: 'Noida, Uttar Pradesh', lat: 28.5688, lng: 77.3720, radius: 1000 },
  { id: 'sec-78', name: 'Sector 78', secondary: 'Noida, Uttar Pradesh', lat: 28.5590, lng: 77.3820, radius: 1100 },
  { id: 'mahagun-moderne', name: 'Mahagun Moderne', secondary: 'Sector 78, Noida', lat: 28.5590, lng: 77.3820, radius: 600 },
  { id: 'assotech-windsor', name: 'Assotech Windsor Court', secondary: 'Sector 78, Noida', lat: 28.5640, lng: 77.3780, radius: 600 },
  { id: 'sec-128', name: 'Sector 128 (Jaypee Wishtown)', secondary: 'Noida Expressway', lat: 28.5105, lng: 77.3830, radius: 1400 },
  { id: 'jaypee-greens', name: 'Jaypee Greens Wishtown', secondary: 'Sector 128, Noida', lat: 28.5105, lng: 77.3830, radius: 1200 },
  { id: 'sec-107', name: 'Sector 107', secondary: 'Noida, Uttar Pradesh', lat: 28.5278, lng: 77.3745, radius: 1000 },
  { id: 'prateek-edifice', name: 'Prateek Edifice', secondary: 'Sector 107, Noida', lat: 28.5278, lng: 77.3745, radius: 600 },
  { id: 'sec-104', name: 'Sector 104 (High Street Hub)', secondary: 'Noida, Uttar Pradesh', lat: 28.5380, lng: 77.3610, radius: 1000 },
  { id: 'sec-100', name: 'Sector 100', secondary: 'Noida, Uttar Pradesh', lat: 28.5445, lng: 77.3920, radius: 1000 },
  { id: 'sec-120', name: 'Sector 120', secondary: 'Noida, Uttar Pradesh', lat: 28.5810, lng: 77.3940, radius: 1000 },
  { id: 'amrapali-zodiac', name: 'Amrapali Zodiac', secondary: 'Sector 120, Noida', lat: 28.5810, lng: 77.3940, radius: 600 },
  { id: 'sec-143', name: 'Sector 143', secondary: 'Noida Expressway', lat: 28.4975, lng: 77.4355, radius: 1200 },
  { id: 'sec-144', name: 'Sector 144', secondary: 'Noida Expressway', lat: 28.4920, lng: 77.4420, radius: 1200 },
  { id: 'sec-168', name: 'Sector 168', secondary: 'Noida Expressway', lat: 28.4810, lng: 77.4620, radius: 1200 },

  // ── Central & Established Sectors ──
  { id: 'sec-15', name: 'Sector 15', secondary: 'Noida, Uttar Pradesh', lat: 28.5840, lng: 77.3140, radius: 900 },
  { id: 'sec-16', name: 'Sector 16 (Film City & World Trade Tower)', secondary: 'Noida, Uttar Pradesh', lat: 28.5780, lng: 77.3180, radius: 900 },
  { id: 'sec-27', name: 'Sector 27 (Atta Market)', secondary: 'Noida, Uttar Pradesh', lat: 28.5770, lng: 77.3270, radius: 800 },
  { id: 'sec-29', name: 'Sector 29 (Brahmaputra Market)', secondary: 'Noida, Uttar Pradesh', lat: 28.5680, lng: 77.3360, radius: 800 },
  { id: 'sec-37', name: 'Sector 37 (Golf Course Metro)', secondary: 'Noida, Uttar Pradesh', lat: 28.5610, lng: 77.3410, radius: 900 },
  { id: 'sec-44', name: 'Sector 44', secondary: 'Noida, Uttar Pradesh', lat: 28.5520, lng: 77.3380, radius: 1000 },
  { id: 'sec-50', name: 'Sector 50', secondary: 'Noida, Uttar Pradesh', lat: 28.5760, lng: 77.3680, radius: 1000 },
  { id: 'sec-52', name: 'Sector 52 (Blue & Aqua Line Interchange)', secondary: 'Noida, Uttar Pradesh', lat: 28.5910, lng: 77.3710, radius: 1000 },
  { id: 'sec-71', name: 'Sector 71', secondary: 'Noida, Uttar Pradesh', lat: 28.5920, lng: 77.3780, radius: 1000 },

  // ── Greater Noida & Extension ──
  { id: 'gaur-city', name: 'Gaur City (1 & 2)', secondary: 'Greater Noida West (Noida Extension)', lat: 28.5930, lng: 77.4310, radius: 1500 },
  { id: 'pari-chowk', name: 'Pari Chowk', secondary: 'Greater Noida, Uttar Pradesh', lat: 28.4650, lng: 77.5110, radius: 1500 },
  { id: 'knowledge-park', name: 'Knowledge Park (I, II, III)', secondary: 'Greater Noida, Uttar Pradesh', lat: 28.4720, lng: 77.4980, radius: 1500 },
  { id: 'alpha-1', name: 'Alpha 1 & 2', secondary: 'Greater Noida, Uttar Pradesh', lat: 28.4780, lng: 77.5180, radius: 1200 },
  { id: 'beta-1', name: 'Beta 1 & 2', secondary: 'Greater Noida, Uttar Pradesh', lat: 28.4690, lng: 77.5250, radius: 1200 },
];

/**
 * Searches the curated Noida database with smart alias matching
 * (e.g. "sec 62", "sector 62", "62", "ats", "capetown", "mall of india")
 */
export function searchNoidaLocations(query: string, maxResults = 5): NoidaLocationItem[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  // Match sector numbers e.g. "62" or "sec 62" or "sector 62"
  const secNumMatch = q.match(/(?:sec(?:tor)?\s*)?(\d{1,3})/i);
  const requestedNum = secNumMatch ? secNumMatch[1] : null;

  const matches: NoidaLocationItem[] = [];

  for (const loc of NOIDA_LOCATIONS) {
    const nameLower = loc.name.toLowerCase();
    const secLower = loc.secondary.toLowerCase();

    let matched = false;

    // Check exact sector match
    if (requestedNum && (nameLower.includes(`sector ${requestedNum}`) || nameLower.includes(`sec-${requestedNum}`))) {
      matched = true;
    } else if (nameLower.includes(q) || secLower.includes(q)) {
      matched = true;
    }

    if (matched) {
      matches.push(loc);
      if (matches.length >= maxResults) break;
    }
  }

  // If a generic sector number between 1 and 168 is asked and not found in curated list, generate it dynamically
  if (matches.length === 0 && requestedNum) {
    const num = parseInt(requestedNum, 10);
    if (num >= 1 && num <= 168) {
      // Interpolated Noida sector coordinates
      const approxLat = 28.5355 + ((num % 20) - 10) * 0.008;
      const approxLng = 77.3910 + (Math.floor(num / 20) - 4) * 0.012;
      return [
        {
          id: `dyn-sec-${num}`,
          name: `Sector ${num}`,
          secondary: 'Noida, Uttar Pradesh',
          lat: Number(approxLat.toFixed(5)),
          lng: Number(approxLng.toFixed(5)),
          radius: 1000,
        },
      ];
    }
  }

  return matches;
}
