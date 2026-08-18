import {
  Bell as NotificationIcon,
  ClipboardList as ClipboardListIcon,
  FileText as File01Icon,
  FolderTreeIcon,
  LayoutDashboard as Layout01Icon,
  MessageSquare as ChatIcon,
  Palette,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  UserRound as UserCircleIcon,
  Users as UserGroupIcon,
} from "@hugeicons/core-free-icons";

export type NavIcon = typeof Layout01Icon;

export interface NavItem {
  path: string;
  label: string;
  icon: NavIcon;
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
    icon: Layout01Icon,
    crumb: ["Dashboard"],
  },
  {
    path: "/documents",
    label: "All documents",
    icon: File01Icon,
    crumb: ["Dashboard", "All documents"],
    claim: "documents:view-list",
  },
  {
    path: "/documents/assigned",
    label: "Assigned documents",
    icon: ClipboardListIcon,
    crumb: ["Dashboard", "Assigned documents"],
    claim: "documents:view-assigned",
  },
  {
    path: "/documents/categories",
    label: "Document categories",
    icon: FolderTreeIcon,
    crumb: ["Dashboard", "Document categories"],
    claim: "documents:view-categories",
  },
  {
    path: "/users",
    label: "Users",
    icon: UserGroupIcon,
    crumb: ["Dashboard", "Users"],
    claim: ["users:manage", "roles:manage"],
  },
  {
    path: "/roles",
    label: "Roles",
    icon: ShieldIcon,
    crumb: ["Dashboard", "Roles"],
    claim: "roles:manage",
  },
  {
    path: "/chat",
    label: "Chat",
    icon: ChatIcon,
    crumb: ["Dashboard", "Chat"],
  },
  {
    path: "/settings",
    label: "Settings",
    icon: SettingsIcon,
    crumb: ["Dashboard", "Settings"],
  },
  {
    path: "/settings/profile",
    label: "Profile",
    icon: UserCircleIcon,
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
    icon: NotificationIcon,
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
