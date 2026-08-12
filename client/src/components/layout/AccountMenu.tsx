import { useNavigate } from "react-router";
import { Menu } from "@base-ui/react/menu";
import { LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/context/auth";
import { getInitials } from "@/lib/initials";

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Account"
        className="rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span aria-hidden="true" className="v-brand-gradient grid h-9 w-9 place-items-center rounded-full text-[11px] font-semibold text-white ring-2 ring-brand-soft">
          {getInitials(user?.fullName ?? "")}
        </span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          className="z-50"
        >
          <Menu.Popup className="w-56 rounded-lg border border-line bg-popover p-2 shadow-pop animate-in fade-in animation-duration-200">
            <div className="px-2 py-1.5">
              <div className="truncate text-[13px] font-medium text-ink-1">
                {user?.fullName ?? "Account"}
              </div>
              <div className="truncate text-[11px] text-ink-3">
                {user?.email}
              </div>
            </div>
            <Menu.Separator className="my-1.5 h-px bg-line" />
            <Menu.Item
              onClick={() => navigate("/settings/profile")}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-[13px] font-medium text-ink-1 transition-colors hover:bg-surface-2 data-highlighted:bg-surface-2 focus:outline-none"
            >
              <UserRound size={15} />
              Profile
            </Menu.Item>
            <Menu.Item
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-[13px] font-medium text-ink-1 transition-colors hover:bg-surface-2 data-highlighted:bg-surface-2 focus:outline-none"
            >
              <LogOut size={15} />
              Log out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
