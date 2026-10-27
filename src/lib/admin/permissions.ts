/**
 * Central permission model for the admin dashboard.
 * The database (role_permissions + user_permissions + has_permission) is the
 * enforcement point; this file mirrors the keys for UI and server checks.
 */

export const PERMISSIONS = [
  "dashboard.view",
  "content.read",
  "content.create",
  "content.update",
  "content.publish",
  "sermons.manage",
  "events.manage",
  "announcements.manage",
  "ministries.manage",
  "media.manage",
  "inquiries.read",
  "inquiries.update",
  "prayer_requests.read",
  "prayer_requests.update",
  "users.manage",
  "audit_logs.read",
  "settings.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrator",
  pastor: "Pastor / Ministry Leader",
  content_editor: "Content / Media Editor",
  event_coordinator: "Event Coordinator",
  support_staff: "Support / Follow-up Staff",
};

export const ASSIGNABLE_ROLES = Object.keys(ROLE_LABELS);
export const STAFF_ROLES = [
  "super_admin",
  "pastor",
  "content_editor",
  "event_coordinator",
  "support_staff",
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export type AdminNavItem = {
  label: string;
  to: string;
  permission: Permission;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", to: "/admin", permission: "dashboard.view" },
  { label: "Pages", to: "/admin/content", permission: "content.read" },
  { label: "Sermons", to: "/admin/sermons", permission: "sermons.manage" },
  { label: "Events", to: "/admin/events", permission: "events.manage" },
  { label: "Announcements", to: "/admin/announcements", permission: "announcements.manage" },
  { label: "Ministries", to: "/admin/ministries", permission: "ministries.manage" },
  { label: "Media Library", to: "/admin/media", permission: "media.manage" },
  { label: "Inquiries", to: "/admin/inquiries", permission: "inquiries.read" },
  { label: "Prayer Requests", to: "/admin/prayer-requests", permission: "prayer_requests.read" },
  { label: "Staff", to: "/admin/users", permission: "users.manage" },
  { label: "Audit Log", to: "/admin/audit-logs", permission: "audit_logs.read" },
];
