import { normalizeTitle } from "./normalize.js";
import type { Matcher } from "./types.js";

export const normalizedTitleMatcher: Matcher = {
  name: "normalized-title",
  match(oldEpisode, newEpisodes, usedNewUuids) {
    const normalized = normalizeTitle(oldEpisode.title);
    return newEpisodes.find((ep) => !usedNewUuids.has(ep.uuid) && normalizeTitle(ep.title) === normalized);
  },
};
