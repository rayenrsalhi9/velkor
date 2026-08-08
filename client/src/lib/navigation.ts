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
  },
  {
    path: "/documents/assigned",
    label: "Assigned documents",
    icon: ClipboardList,
    crumb: ["Dashboard", "Assigned documents"],
  },
  {
    path: "/documents/categories",
    label: "Document categories",
    icon: FolderTree,
    crumb: ["Dashboard", "Document categories"],
  },
  {
    path: "/users",
    label: "Users",
    icon: Users,
    crumb: ["Dashboard", "Users"],
  },
  {
    path: "/roles",
    label: "Roles",
    icon: Shield,
    crumb: ["Dashboard", "Roles"],
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
    path: i === item.crumb.length - 1 ? null : (crumbPathByLabel.get(label) ?? null),
  }));
}
