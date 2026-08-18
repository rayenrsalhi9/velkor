import { NavLink, Outlet } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { NotificationIcon, Palette, UserCircleIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/cn";
import PageHeader from "@/components/PageHeader";

const SECTIONS = [
  { to: "/settings/profile", label: "Profile", icon: UserCircleIcon },
  { to: "/settings/appearance", label: "Appearance", icon: Palette },
  { to: "/settings/notifications", label: "Notifications", icon: NotificationIcon },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your profile, appearance and notifications."
      />

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
        <nav
          aria-label="Settings sections"
          className="-mx-4 flex shrink-0 gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:w-[200px] md:flex-col md:overflow-visible md:px-0 md:pb-0"
        >
          {SECTIONS.map((section) => {
            const icon = section.icon;
            return (
              <NavLink
                key={section.to}
                to={section.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex h-10 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-[13px] font-medium transition-colors duration-150",
                    isActive
                      ? "bg-brand-soft text-brand"
                      : "text-ink-2 hover:bg-surface-2 hover:text-ink-1",
                  )
                }
              >
                <HugeiconsIcon icon={icon} size={16} className="shrink-0" />
                {section.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="min-w-0 w-full max-w-[760px] flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
