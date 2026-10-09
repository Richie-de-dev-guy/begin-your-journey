/**
 * Ministries content.
 * PLACEHOLDER categories — the church must confirm which ministries
 * currently operate before launch. Edit this file to update.
 */
export type Ministry = {
  slug: string;
  name: string;
  description: string;
  schedule?: string;
  contact?: string;
  placeholder: boolean;
};

export const ministries: Ministry[] = [
  {
    slug: "youth",
    name: "Youth Ministry",
    description:
      "A place for young people to grow in faith, build godly friendships, and discover their purpose in Christ.",
    placeholder: true,
  },
  {
    slug: "children",
    name: "Children's Ministry",
    description:
      "Nurturing children in the love and Word of God through age-appropriate teaching, songs, and activities.",
    placeholder: true,
  },
  {
    slug: "prayer",
    name: "Prayer Ministry",
    description:
      "Standing in the gap for families, the church, and the nation through intercessory prayer.",
    placeholder: true,
  },
  {
    slug: "choir",
    name: "Choir & Worship",
    description:
      "Leading the congregation in heartfelt worship and praise, ushering in the presence of God.",
    placeholder: true,
  },
  {
    slug: "evangelism",
    name: "Evangelism & Outreach",
    description:
      "Sharing the gospel of Christ with our community in Calabar and beyond, in word and in deed.",
    placeholder: true,
  },
  {
    slug: "women",
    name: "Women's Fellowship",
    description:
      "Women encouraging one another in faith, family, and service to God and the community.",
    placeholder: true,
  },
  {
    slug: "men",
    name: "Men's Fellowship",
    description:
      "Men growing together as godly leaders in their homes, church, and workplaces.",
    placeholder: true,
  },
];
