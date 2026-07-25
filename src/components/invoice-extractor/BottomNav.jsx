import { Link, useLocation } from "react-router-dom";
import { Home as HomeIcon, ScanText, Settings as SettingsIcon } from "lucide-react";

export default function BottomNav() {
  const { pathname } = useLocation();

  const tabs = [
    { to: "/", label: "Home", icon: HomeIcon, active: pathname === "/" },
    { to: "/app", label: "Tool", icon: ScanText, active: pathname === "/app" },
    { to: "/settings", label: "Settings", icon: SettingsIcon, active: pathname === "/settings" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-safe backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            aria-current={t.active ? "page" : undefined}
            className="flex min-h-[44px] flex-1 select-none flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <t.icon className={`h-5 w-5 ${t.active ? "text-accent-ink" : "text-muted-foreground"}`} aria-hidden="true" />
            <span className={t.active ? "text-accent-ink" : "text-muted-foreground"}>{t.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}