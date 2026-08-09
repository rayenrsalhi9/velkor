import {
  Bell,
  ClipboardList,
  FileText,
  FolderTree,
  LayoutDashboard,
  MessageSquare,
  Palette,
  Settings,
  Shield,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  crumb: string[];
  claim?: string | string[];
}

export const WILDCARD_CLAIM = "*";

export function hasClaim(
  claims: string[],
  required: string | string[] | undefined,
): boolean {
  if (!required) return true;
  const requiredClaims = Array.isArray(required) ? required : [required];
  return requiredClaims.every(
    (claim) =>
      claims.includes(WILDCARD_CLAIM) || claims.includes(claim),
  );
}

export function visibleNavItems(claims: string[]): NavItem[] {
  return NAV_ITEMS.filter((item) => hasClaim(claims, item.claim));
}

export const NAV_ITEMS: NavItem[] = [
  {
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    crumb: ["Dashboard"],
  },
  {
    path: "/documents",
    label: "All documents",
    icon: FileText,
    crumb: ["Dashboard", "All documents"],
    claim: "documents:view-list",
  },
  {
    path: "/documents/assigned",
    label: "Assigned documents",
    icon: ClipboardList,
    crumb: ["Dashboard", "Assigned documents"],
    claim: "documents:view-assigned",
  },
  {
    path: "/documents/categories",
    label: "Document categories",
    icon: FolderTree,
    crumb: ["Dashboard", "Document categories"],
    claim: "documents:view-categories",
  },
  {
    path: "/users",
    label: "Users",
    icon: Users,
    crumb: ["Dashboard", "Users"],
    claim: ["users:manage", "roles:manage"],
  },
  {
    path: "/roles",
    label: "Roles",
    icon: Shield,
    crumb: ["Dashboard", "Roles"],
    claim: "roles:manage",
  },
  {
    path: "/chat",
    label: "Chat",
    icon: MessageSquare,
    crumb: ["Dashboard", "Chat"],
  },
  {
    path: "/settings",
    label: "Settings",
    icon: Settings,
    crumb: ["Dashboard", "Settings"],
  },
  {
    path: "/settings/profile",
    label: "Profile",
    icon: UserRound,
    crumb: ["Settings", "Profile"],
  },
  {
    path: "/settings/appearance",
    label: "Appearance",
    icon: Palette,
    crumb: ["Settings", "Appearance"],
  },
  {
    path: "/settings/notifications",
    label: "Notifications",
    icon: Bell,
    crumb: ["Settings", "Notifications"],
  },
];

export interface Crumb {
  label: string;
  path: string | null;
}

const crumbPathByLabel = new Map(
  NAV_ITEMS.map((item) => [item.crumb[item.crumb.length - 1], item.path]),
);

export function crumbFor(pathname: string): Crumb[] {
  const item = NAV_ITEMS.find((nav) => nav.path === pathname);
  if (!item) {
    return [];
  }
  return item.crumb.map((label, i) => ({
    label,
    path:
      i === item.crumb.length - 1
        ? null
        : (crumbPathByLabel.get(label) ?? null),
  }));
}
