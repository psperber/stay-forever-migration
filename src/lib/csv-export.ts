import { writeFileSync } from "node:fs";
import type { EpisodeMatch } from "./match.js";
import type { EpisodeStatus } from "./types.js";

export function exportMatchesCsv(
  csvPath: string,
  matches: EpisodeMatch[],
  getStatus: (m: EpisodeMatch) => EpisodeStatus | undefined,
): void {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;

  const csvLines = [
    "source,matchMethod,oldTitle,newTitle,oldUuid,newUuid,playingStatus,playedUpTo",
    ...matches.map((m) => {
      const status = getStatus(m);
      return [
        escape(m.source),
        m.matchMethod,
        escape(m.oldEpisode.title),
        m.newEpisode ? escape(m.newEpisode.title) : "",
        m.oldEpisode.uuid,
        m.newEpisode?.uuid ?? "",
        status?.playingStatus ?? "",
        status?.playedUpTo ?? "",
      ].join(",");
    }),
  ];

  writeFileSync(csvPath, csvLines.join("\n"), "utf-8");
  console.log(`\nCSV exportiert: ${csvPath} (${matches.length} Einträge)`);
}
