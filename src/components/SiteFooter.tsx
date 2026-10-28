import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { church, navItems } from "@/config/church";
import { ministries } from "@/content/ministries";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-forest-deep text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src="/cfcm-logo.png" alt="" className="h-10 w-10 shrink-0 object-contain" />
            <p className="font-heading text-lg font-bold">{church.name}</p>
          </div>
          <p className="mt-3 text-sm text-primary-foreground/80">
            A Christian community in {church.city}, {church.state}, committed to faith, fellowship,
            spiritual growth, and sharing the love of Christ.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <h3 className="font-heading text-base font-semibold text-gold">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-primary-foreground/80 hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/privacy" className="text-primary-foreground/80 hover:text-gold">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Ministry links">
          <h3 className="font-heading text-base font-semibold text-gold">Ministries</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {ministries.slice(0, 5).map((m) => (
              <li key={m.slug}>
                <Link to="/ministries" className="text-primary-foreground/80 hover:text-gold">
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="font-heading text-base font-semibold text-gold">Contact</h3>
          <ul className="mt-3 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              <a href={church.phoneHref} className="hover:text-gold">{church.phone}</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              <a href={church.emailHref} className="break-all hover:text-gold">{church.email}</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              <span>{church.address}</span>
            </li>
            <li>
              <a
                href={church.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md border border-gold px-3 py-1.5 font-medium text-gold hover:bg-gold hover:text-forest-deep"
              >
                Get Directions
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-5 text-center text-xs text-primary-foreground/60">
        © {year} {church.name}. All rights reserved.
      </div>
    </footer>
  );
}
