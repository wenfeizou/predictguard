import {
  BellRing,
  Bot,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  Layers,
  Rocket,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: <Rocket className="h-4 w-4" /> },
  { label: "Reports", href: "/reports", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Monitoring", href: "/monitoring", icon: <BellRing className="h-4 w-4" /> },
  { label: "Portfolio", href: "/portfolio", icon: <BriefcaseBusiness className="h-4 w-4" /> },
  { label: "Team", href: "/team", icon: <BriefcaseBusiness className="h-4 w-4" /> },
  { label: "Adapters", href: "/adapters", icon: <Layers className="h-4 w-4" /> },
  { label: "Copilot", href: "/copilot", icon: <Bot className="h-4 w-4" /> },
  { label: "Feedback", href: "/feedback", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Integrations", href: "/integrations", icon: <Layers className="h-4 w-4" /> },
  { label: "Pricing", href: "/pricing", icon: <BriefcaseBusiness className="h-4 w-4" /> },
  { label: "Readiness", href: "/readiness", icon: <FileText className="h-4 w-4" /> },
  { label: "Release", href: "/release", icon: <Rocket className="h-4 w-4" /> },
];

export function ProductNav({ active }: { active?: string }) {
  return (
    <nav className="border-b border-[#dce3dd] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-5 py-3 text-sm font-semibold lg:px-8">
        {navItems.map((item) => {
          const isActive = item.label === active;

          return (
            <a
              key={item.href}
              href={item.href}
              className={`inline-flex whitespace-nowrap rounded-md border px-3 py-2 transition ${
                isActive
                  ? "border-[#1f8a70] bg-[#e8f4ef] text-[#1f8a70]"
                  : "border-[#dce3dd] bg-white text-[#52615a] hover:border-[#1f8a70] hover:text-[#1f8a70]"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
