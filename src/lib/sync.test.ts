import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncPlayStatus, syncArchiveStatus } from "./sync.js";
import type { EpisodeMatch } from "./match.js";
import { PlayingStatus } from "./types.js";
import type { Episode, EpisodeStatus } from "./types.js";
import type { PodcastClient } from "./apps/podcast-client.js";

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

function makeMatch(method: EpisodeMatch["matchMethod"] = "exact-title"): EpisodeMatch {
  return {
    oldEpisode: makeEpisode("Old"),
    newEpisode: makeEpisode("New"),
    source: "Test",
    matchMethod: method,
  };
}

function createMockClient(): PodcastClient {
  return {
    login: vi.fn(),
    getPodcastList: vi.fn(),
    getEpisodes: vi.fn(),
    getEpisodeStatus: vi.fn(),
    markEpisodePlayed: vi.fn(),
    markEpisodeInProgress: vi.fn(),
    archiveEpisodes: vi.fn(),
  };
}

describe("syncPlayStatus", () => {
  let client: PodcastClient;

  beforeEach(() => {
    client = createMockClient();
  });

  it("marks played episodes as played", async () => {
    const match = makeMatch("exact-title");
    const status: EpisodeStatus = {
      uuid: match.oldEpisode.uuid,
      podcastUuid: "",
      playingStatus: PlayingStatus.Played,
      playedUpTo: 3600,
      isDeleted: false,
      starred: false,
    };

    await syncPlayStatus([match], () => status, client, "pod-uuid", false);

    expect(client.markEpisodePlayed).toHaveBeenCalledWith(match.newEpisode.uuid, "pod-uuid");
    expect(client.markEpisodeInProgress).not.toHaveBeenCalled();
  });

  it("marks in-progress episodes with playedUpTo", async () => {
    const match = makeMatch("exact-title");
    const status: EpisodeStatus = {
      uuid: match.oldEpisode.uuid,
      podcastUuid: "",
      playingStatus: PlayingStatus.InProgress,
      playedUpTo: 1234,
      isDeleted: false,
      starred: false,
    };

    await syncPlayStatus([match], () => status, client, "pod-uuid", false);

    expect(client.markEpisodeInProgress).toHaveBeenCalledWith(match.newEpisode.uuid, "pod-uuid", 1234);
    expect(client.markEpisodePlayed).not.toHaveBeenCalled();
  });

  it("skips unmatched episodes", async () => {
    const match = makeMatch("unmatched");
    const status: EpisodeStatus = {
      uuid: match.oldEpisode.uuid,
      podcastUuid: "",
      playingStatus: PlayingStatus.Played,
      playedUpTo: 3600,
      isDeleted: false,
      starred: false,
    };

    await syncPlayStatus([match], () => status, client, "pod-uuid", false);

    expect(client.markEpisodePlayed).not.toHaveBeenCalled();
  });

  it("does not call API in dry-run mode", async () => {
    const match = makeMatch("exact-title");
    const status: EpisodeStatus = {
      uuid: match.oldEpisode.uuid,
      podcastUuid: "",
      playingStatus: PlayingStatus.Played,
      playedUpTo: 3600,
      isDeleted: false,
      starred: false,
    };

    await syncPlayStatus([match], () => status, client, "pod-uuid", true);

    expect(client.markEpisodePlayed).not.toHaveBeenCalled();
  });
});

describe("syncArchiveStatus", () => {
  let client: PodcastClient;

  beforeEach(() => {
    client = createMockClient();
  });

  it("archives unplayed+deleted episodes", async () => {
    const match = makeMatch("exact-title");
    const status: EpisodeStatus = {
      uuid: match.oldEpisode.uuid,
      podcastUuid: "",
      playingStatus: PlayingStatus.NotPlayed,
      playedUpTo: 0,
      isDeleted: true,
      starred: false,
    };

    await syncArchiveStatus([match], () => status, client, "pod-uuid", false);

    expect(client.archiveEpisodes).toHaveBeenCalledWith([{ uuid: match.newEpisode.uuid, podcast: "pod-uuid" }]);
  });

  it("does not archive played episodes", async () => {
    const match = makeMatch("exact-title");
    const status: EpisodeStatus = {
      uuid: match.oldEpisode.uuid,
      podcastUuid: "",
      playingStatus: PlayingStatus.Played,
      playedUpTo: 3600,
      isDeleted: true,
      starred: false,
    };

    await syncArchiveStatus([match], () => status, client, "pod-uuid", false);

    expect(client.archiveEpisodes).not.toHaveBeenCalled();
  });

  it("does not archive in dry-run mode", async () => {
    const match = makeMatch("exact-title");
    const status: EpisodeStatus = {
      uuid: match.oldEpisode.uuid,
      podcastUuid: "",
      playingStatus: PlayingStatus.NotPlayed,
      playedUpTo: 0,
      isDeleted: true,
      starred: false,
    };

    await syncArchiveStatus([match], () => status, client, "pod-uuid", true);

    expect(client.archiveEpisodes).not.toHaveBeenCalled();
  });
});
