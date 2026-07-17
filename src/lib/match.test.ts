import { describe, it, expect } from "vitest";
import { normalizeTitle, matchEpisodes } from "./match.js";
import type { Episode } from "./types.js";

function makeEpisode(title: string, overrides?: Partial<Episode>): Episode {
  return {
    uuid: crypto.randomUUID(),
    title,
    slug: "",
    url: "",
    file_type: "audio/mp3",
    file_size: 0,
    duration: 3600,
    published: "2024-01-01T00:00:00Z",
    type: "full",
    ...overrides,
  };
}

describe("normalizeTitle", () => {
  it("lowercases and removes special characters", () => {
    expect(normalizeTitle("Hello, World!")).toBe("hello world");
  });

  it("collapses whitespace", () => {
    expect(normalizeTitle("  foo   bar  ")).toBe("foo bar");
  });
});

describe("matchEpisodes", () => {
  it("matches by exact title", () => {
    const old = [makeEpisode("Episode 1")];
    const newEps = [makeEpisode("Episode 1")];
    const result = matchEpisodes(old, newEps, "test");
    expect(result[0].matchMethod).toBe("exact-title");
    expect(result[0].newEpisode.uuid).toBe(newEps[0].uuid);
  });

  it("matches by normalized title", () => {
    const old = [makeEpisode("Episode #1!")];
    const newEps = [makeEpisode("Episode  1")];
    const result = matchEpisodes(old, newEps, "test");
    expect(result[0].matchMethod).toBe("normalized-title");
  });

  it("matches by prefix (Stay Forever - )", () => {
    const old = [makeEpisode("Retrogames Folge 5")];
    const newEps = [makeEpisode("Stay Forever - Retrogames Folge 5")];
    const result = matchEpisodes(old, newEps, "test");
    expect(result[0].matchMethod).toBe("prefix");
  });

  it("matches by date and duration", () => {
    const old = [makeEpisode("Old Title", { published: "2024-03-15T10:00:00Z", duration: 7200 })];
    const newEps = [makeEpisode("New Title", { published: "2024-03-15T14:00:00Z", duration: 7250 })];
    const result = matchEpisodes(old, newEps, "test");
    expect(result[0].matchMethod).toBe("date-and-duration");
  });

  it("marks unmatched episodes", () => {
    const old = [makeEpisode("Unique Old Episode", { published: "2020-01-01T00:00:00Z", duration: 100 })];
    const newEps = [makeEpisode("Completely Different", { published: "2024-06-01T00:00:00Z", duration: 9999 })];
    const result = matchEpisodes(old, newEps, "test");
    expect(result[0].matchMethod).toBe("unmatched");
  });
});
