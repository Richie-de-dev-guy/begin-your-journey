/**
 * Sermons content.
 * No real sermons have been supplied yet — this list is intentionally empty
 * so the site shows an honest empty state. Add entries here (or connect a
 * CMS in a future phase) as sermons are published.
 */
export type Sermon = {
  id: string;
  title: string;
  speaker: string;
  date: string; // ISO date
  passage?: string;
  topic?: string;
  thumbnailUrl?: string;
  mediaUrl?: string; // video or audio link
};

export const sermons: Sermon[] = [];
