/**
 * Static matching table for episodes that can't be matched by generic matchers.
 * Maps old episode title → new episode identifier (title, or {season, number}).
 *
 * This covers cases like:
 * - Different naming conventions (prefix, subtitle differences)
 * - Heftkritik year/format changes
 * - Interview episodes with different titles
 * - Format ohne Namen numbering differences
 *
 * Generated via: npx tsx scripts/generate-static-table.ts
 */

export type StaticMatch = { title: string } | { season: number; number: number };

/**
 * Keys are matched as prefixes – if an old episode title starts with a key, it matches.
 * This handles truncated titles from the API.
 */
export const STATIC_MATCHES: Record<string, StaticMatch> = {
  // Neuzugänge – subtitles added in new feed
  "Neuzugänge #9": {
    title: "Neuzugänge #9: Terran Envoy, Normality, If it moves,  Dark Sun: Crimson Sands, All-Style Fighter",
  },
  "Neuzugänge #8: NFK, Sanctuary, Hooves of Thunder, L.E.D. Wars,…": {
    title: "Neuzugänge #8: NFK, Sanctuary, Hooves of Thunder, L.E.D. Wars, W.G.B.G",
  },

  // Heftkritik – format changes
  "Heftkritik: GS 9/2000": { title: "Heftkritik: GameStar 9/2000" },
  "Heftkritik 8/98": { title: "Heftkritik: GameStar 8/1998" },
  "Heftkritik 11/98": { title: "Heftkritik: GameStar 11/1998" },
  "Heftkritik 2/2000": { title: "Heftkritik: GameStar 2/2000" },

  // Wissenslücken – #0 suffix removed
  "Wissenslücken #0": { title: "Wissenslücken" },

  // Anchorhead – quoted subtitles stripped (titles truncated in API)
  'Stay Forever Spielt: Anchorhead #4 "Die dunkle': { season: 15, number: 4 },
  'Stay Forever Spielt: Anchorhead #3 "Eine tödliche': { season: 15, number: 3 },
  'Stay Forever Spielt: Anchorhead #2 "Eine geheime': { season: 15, number: 2 },

  // Biosys – quoted subtitles stripped / SFS prefix
  'Stay Forever Spielt: Biosys #6 "Wir erschaffen': { season: 14, number: 6 },
  'Stay Forever Spielt: Biosys #5 "Aufgeputscht': { season: 14, number: 5 },
  'Stay Forever Spielt: Biosys #4 "Expeditionen': { season: 14, number: 4 },
  'Stay Forever Spielt: Biosys #3 "Aha, so sehen': { season: 14, number: 3 },
  'SFS 14: Stay Forever Spielt Biosys "Wir stehen': { season: 14, number: 1 },
  'SFS 14: Stay Forever Spielt: Biosys #2 "Schmidt': { season: 14, number: 2 },

  // Format ohne Namen – numbering differences
  "Das Format ohne Namen #6": { title: "Format ohne Namen #6" },
  "Format ohne Namen: Folge #2": {
    title: "Format ohne Namen #2: Luxustelefone, Nachrichtenkonsum und gewagte Prognosen",
  },
  "Format ohne Namen: Folge #1": { title: "Format ohne Namen" },

  // SFS interviews – different title format in new feed
  'SFS 13: Drachen von Laas #7 "Interview mit Guido Henkel"': { season: 0, number: 7 },
  'SFS 13: Drachen von Laas #6 "Das Geheimnis': { title: "Stay Forever Spielt: Drachen von Laas #6" },
  'SFS 13: Drachen von Laas #5 "Chris lernt': { season: 13, number: 6 },
  'SFS 11: Bozuma #9 "Ein Gespräch mit Ralph Stock"': { season: 0, number: 9 },
  "SFS 9: Amnesia #8": { title: "Stay Forever Spielt: Amnesia (Interview mit Don Daglow)" },
  "SFS 8: Bloodnet #10": { title: "Stay Forever Spielt: Bloodnet (Interview)" },
  "SFS 7: Jonathan #9": { title: "SFS: Jonathan (Ein Gespräch mit Christoph Földing)" },

  // Retro-Überblick – "Stay Forever" prefix added
  "Retro-Überblick - November 2018": { title: "Stay Forever Retro-Überblick - November 2018" },
  "Retro-Überblick - Oktober 2018": { title: "Stay Forever Retro-Überblick - Oktober 2018" },
  "Retro-Überblick - September 2018": { title: "Stay Forever Retro-Überblick - September 2018" },
  "Retro-Überblick - August 2018": { title: "Stay Forever Retro-Überblick - August 2018" },
  "Retro-Überblick - Juli 2018": { title: "Stay Forever Retro-Überblick - Juli 2018" },

  // Conversations → Interviews
  "A conversation with Julian Eggebrecht": { title: "Interview mit Julian Eggebrecht" },
};
