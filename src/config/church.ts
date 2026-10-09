/**
 * Central church configuration.
 * Update church-wide facts here only — every page reads from this file.
 * Fields marked PLACEHOLDER must be confirmed by the church before launch.
 */

export const church = {
  name: "Chosen Fruit Covenant Ministries Int’l Inc.",
  shortName: "Chosen Fruit Covenant Ministries",
  category: "Pentecostal / Charismatic Christian ministry",
  phone: "08032770821",
  phoneHref: "tel:+2348032770821",
  email: "info.cfcm@gmail.com",
  emailHref: "mailto:info.cfcm@gmail.com",
  address:
    "2958+C5J, before Jonathan By-pass Roundabout, Etap Ayip, Akai Efa Road, Calabar, Cross River State, Nigeria",
  landmark: "Jonathan By-pass Roundabout",
  city: "Calabar",
  state: "Cross River State",
  country: "Nigeria",
  directionsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      "Chosen Fruit Covenant Ministries, Akai Efa Road, Etap Ayip, Calabar, Cross River State, Nigeria",
    ),
  /** PLACEHOLDER — the church has not supplied service times yet. */
  serviceTimes: null as null | { label: string; time: string }[],
  /** PLACEHOLDER — confirmed social media links go here. None supplied yet. */
  social: [] as { label: string; href: string }[],
} as const;

export const navItems = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Ministries", to: "/ministries" },
  { label: "Sermons", to: "/sermons" },
  { label: "Events", to: "/events" },
  { label: "Plan Your Visit", to: "/visit" },
  { label: "Contact", to: "/contact" },
] as const;

/** Proposed copy — not yet an officially approved mission statement. */
export const proposedCopy = {
  heroHeadline: "Growing in Faith. Walking in Love. Bearing Fruit for His Glory.",
  heroIntro:
    "Welcome to Chosen Fruit Covenant Ministries Int’l Inc. We are a Christian community committed to faith, fellowship, spiritual growth, and sharing the love of Christ. We invite you to connect with us, grow in God's Word, and become part of our community.",
  missionIntro:
    "Our mission is to nurture a community rooted in God's Word, growing together in faith and bearing lasting fruit for His glory. (Placeholder wording — to be replaced with the church's official mission statement.)",
} as const;
