import type { Matcher } from "./types.js";

export const exactTitleMatcher: Matcher = {
  name: "exact-title",
  match(oldEpisode, newEpisodes, usedNewUuids) {
    return newEpisodes.find((ep) => !usedNewUuids.has(ep.uuid) && ep.title === oldEpisode.title);
  },
};
