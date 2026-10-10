# Chosen Fruit Covenant Ministries Int’l Inc. — Website (Phase 1)

Public website for Chosen Fruit Covenant Ministries Int’l Inc., a Pentecostal / Charismatic
Christian ministry in Calabar, Cross River State, Nigeria.

## Tech stack

- TanStack Start (React 19 + TypeScript, SSR) with Vite
- Tailwind CSS v4 (design tokens in `src/styles.css`)
- Lucide React icons
- File-based routing in `src/routes/`

## Development

```bash
bun install
bun run dev      # local dev server
bun run build    # production build
```

## Project structure

- `src/config/church.ts` — **single source of truth** for church name, phone, email, address,
  navigation, service times, and social links. Update church facts here only.
- `src/content/` — typed content modules: `ministries.ts`, `sermons.ts`, `events.ts`.
  Sermons and events are intentionally empty until the church supplies real content.
- `src/components/` — reusable components: `SiteHeader`, `SiteFooter`, `sections.tsx`
  (PageHero, MinistryCard, SermonCard, EventCard, ContactDetails, ServiceTimes, …),
  `ContactForm.tsx`, `ui.tsx` (PageContainer, SectionHeading, buttons, EmptyState).
- `src/routes/` — pages: `/`, `/about`, `/ministries`, `/sermons`, `/events`, `/contact`,
  `/visit`, `/privacy`.
- `public/sitemap.xml`, `public/robots.txt` — SEO files (add absolute URLs once the
  production domain is known).

## Information still needed from the church before launch

1. Official mission / vision statements, church history, core values, statement of faith.
2. Service times (currently a placeholder prompting visitors to call).
3. Pastor / leadership names and introductions.
4. Confirmed list of active ministries (current cards are labelled examples).
5. Real sermons and events to publish.
6. Official logo (a text-based logo is used for now).
7. Confirmed social media links, if any.
8. Review and approval of the draft privacy policy.
9. Review of the Google Business listing spelling (“Choosen Fruit Ministry” vs the official name).

## Contact form integration point

No email service is connected in Phase 1. A valid form submission opens the visitor's
email app with a pre-filled message to the church (see `deliver()` in
`src/components/ContactForm.tsx`). For Phase 2, replace it with a server function that
sends email or stores enquiries, and add spam protection before public launch.

## Future phases

The architecture is ready for: an admin dashboard and CMS (Phase 2), online giving via
Paystack/Flutterwave (Phase 3), and member accounts / event registration (Phase 4).
Content modules in `src/content/` can be swapped for CMS-backed data without changing
the page components.
