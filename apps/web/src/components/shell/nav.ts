export const CITIZEN_NAV = [
  { href: "/app", label: "Home", hi: "होम", icon: "House" },
  { href: "/app/vault", label: "Vault", hi: "वॉल्ट", icon: "Vault" },
  { href: "/app/apply", label: "Apply", hi: "आवेदन", icon: "Send" },
  { href: "/app/applications", label: "Track", hi: "ट्रैक", icon: "ListChecks" },
  { href: "/app/documents", label: "Documents", hi: "दस्तावेज़", icon: "FileText" },
  { href: "/app/verify", label: "Verify", hi: "सत्यापन", icon: "BadgeCheck" },
  { href: "/app/connections", label: "Connections", hi: "कनेक्शन", icon: "Link2" },
  { href: "/app/family", label: "Family", hi: "परिवार", icon: "Users" },
  { href: "/app/settings", label: "Settings", hi: "सेटिंग्स", icon: "Settings" },
] as const;
export const MOBILE_TABS = ["/app", "/app/vault", "/app/apply", "/app/applications", "/app/settings"] as const;
export const PARTNER_NAV = [
  { href: "/partner", label: "Overview", icon: "LayoutDashboard" },
  { href: "/partner/forms", label: "Forms", icon: "FileInput" },
  { href: "/partner/applicants", label: "Applicants", icon: "Users" },
  { href: "/partner/developers", label: "Developers", icon: "Code2" },
  { href: "/partner/team", label: "Team", icon: "UserPlus" },
  { href: "/partner/settings", label: "Settings", icon: "Settings" },
] as const;
export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: "LayoutDashboard" },
  { href: "/admin/partners", label: "Partners", icon: "Building2" },
  { href: "/admin/providers", label: "Providers", icon: "Plug" },
  { href: "/admin/queues", label: "Queues", icon: "ListOrdered" },
  { href: "/admin/audit", label: "Audit", icon: "ScrollText" },
  { href: "/admin/requests", label: "Data requests", icon: "Inbox" },
] as const;
