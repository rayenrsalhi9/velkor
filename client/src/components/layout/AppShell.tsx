import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { cn } from "@/lib/cn";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import CommandPalette from "@/components/CommandPalette";
import { Toaster } from "@/components/ui/sonner";

const COLLAPSE_KEY = "velkor-sidebar-collapsed";

export default function AppShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_KEY);
      if (stored !== null) return stored === "1";
    } catch {
      /* ignore */
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const persistCollapse = useCallback((v: boolean) => {
    setCollapsed(v);
    try {
      localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1279px)");
    const apply = () => {
      if (mq.matches) {
        setCollapsed(true);
      } else {
        try {
          const stored = localStorage.getItem(COLLAPSE_KEY);
          setCollapsed(stored === "1");
        } catch {
          /* ignore */
        }
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        persistCollapse(!collapsed);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, persistCollapse]);

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "flex min-h-[100dvh] flex-col transition-[padding] duration-[250ms] ease-out",
          collapsed ? "md:pl-[68px]" : "md:pl-[264px]",
        )}
      >
        <TopBar
          onMenu={() => setMobileOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => persistCollapse(!collapsed)}
          onOpenCommand={() => setCommandOpen(true)}
        />

        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

        <main
          key={location.pathname}
          className="v-fade mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 lg:px-6"
        >
          <Outlet />
        </main>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}
