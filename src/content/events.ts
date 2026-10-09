/**
 * Events content.
 * No event dates or programmes have been supplied yet — this list is
 * intentionally empty so the site shows an honest empty state. Add entries
 * here as events are confirmed.
 */
export type ChurchEvent = {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date
  startTime?: string;
  venue?: string;
  imageUrl?: string;
  registrationUrl?: string;
};

export const events: ChurchEvent[] = [];
