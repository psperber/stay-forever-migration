import { writeFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { beforeEach } from "vitest";
import { exportMatchesCsv } from "./csv-export.js";
import type { EpisodeMatch } from "./match.js";
import { PlayingStatus } from "./types.js";
import type { Episode, EpisodeStatus } from "./types.js";

vi.mock("node:fs", () => ({
  writeFileSync: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeEpisode(title: string, uuid?: string): Episode {
  return {
    uuid: uuid ?? crypto.randomUUID(),
    title,
    slug: "",
    url: "",
    file_type: "audio/mp3",
    file_size: 0,
    duration: 3600,
    published: "2024-01-01T00:00:00Z",
    type: "full",
  };
}

function makeMatch(oldTitle: string, newTitle: string, method: EpisodeMatch["matchMethod"]): EpisodeMatch {
  return {
    oldEpisode: makeEpisode(oldTitle),
    newEpisode: makeEpisode(newTitle),
    source: "Test Podcast",
    matchMethod: method,
  };
}

describe("exportMatchesCsv", () => {
  it("writes CSV with correct header and data rows", () => {
    const matches = [makeMatch("Old Ep 1", "New Ep 1", "exact-title")];
    const status: EpisodeStatus = {
      uuid: matches[0].oldEpisode.uuid,
      podcastUuid: "",
      playingStatus: PlayingStatus.Played,
      playedUpTo: 3600,
      isDeleted: false,
      starred: false,
    };
    const getStatus = () => status;

    exportMatchesCsv("output.csv", matches, getStatus);

    expect(writeFileSync).toHaveBeenCalledWith(
      "output.csv",
      expect.stringContaining("source,matchMethod,oldTitle,newTitle"),
      "utf-8",
    );
    const content = (writeFileSync as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    const lines = content.split("\n");
    expect(lines).toHaveLength(2); // header + 1 row
    expect(lines[1]).toContain("exact-title");
    expect(lines[1]).toContain('"Old Ep 1"');
    expect(lines[1]).toContain('"New Ep 1"');
  });

  it("escapes quotes in titles", () => {
    const matches = [makeMatch('Say "Hello"', "New Ep", "normalized-title")];
    const getStatus = () => undefined;

    exportMatchesCsv("out.csv", matches, getStatus);

    const content = (writeFileSync as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(content).toContain('"Say ""Hello"""');
  });

  it("handles empty matches array", () => {
    exportMatchesCsv("empty.csv", [], () => undefined);

    const content = (writeFileSync as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    const lines = content.split("\n").filter((l) => l.length > 0);
    expect(lines).toHaveLength(1); // header only
  });
});
