import type { Matcher } from "./types.js";

function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function durationSimilar(a: number, b: number): boolean {
  return Math.abs(a - b) <= 60;
}

export const dateAndDurationMatcher: Matcher = {
  name: "date-and-duration",
  match(oldEpisode, newEpisodes, usedNewUuids) {
    return newEpisodes.find(
      (ep) =>
        !usedNewUuids.has(ep.uuid) &&
        sameDay(ep.published, oldEpisode.published) &&
        durationSimilar(ep.duration, oldEpisode.duration),
    );
  },
};
