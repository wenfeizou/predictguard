import { CheckCircle2, Rocket, ShieldCheck } from "lucide-react";

import { ProductNav } from "@/app/product-nav";

const checks = [
  {
    group: "Local quality",
    items: ["bun run lint", "bun run typecheck", "bun run build", "Manual UI smoke test"],
  },
  {
    group: "Wallet workflow",
    items: ["Connect Slush on testnet", "Verify dUSDC readiness", "Build PTB", "Confirm manager readback"],
  },
  {
    group: "Production deploy",
    items: ["Pull latest main on server", "docker compose -f docker-compose.prod.yml up -d --build", "nginx proxy still targets predictguard:3000", "HTTPS apex and www redirect check"],
  },
  {
    group: "Rollback",
    items: ["Record previous image/container", "Keep prior git commit hash", "docker compose logs check", "curl -I https://predictguard.xyz"],
  },
];

export default function ReadinessPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211d]">
      <section className="border-b border-[#dce3dd] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <a
            href="/"
            className="text-sm font-semibold text-[#1f8a70] transition hover:text-[#17211d]"
          >
            Back to dashboard
          </a>
          <div className="mt-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dce3dd] bg-[#f5f7f4] px-3 py-1 text-sm font-medium text-[#1f8a70]">
              <Rocket className="h-4 w-4" />
              Production readiness
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
              Deployment checklist for PredictGuard
            </h1>
            <p className="mt-4 text-base leading-7 text-[#52615a]">
              This checklist keeps product development and production deployment
              separate. It is meant to be reviewed before updating
              predictguard.xyz.
            </p>
          </div>
        </div>
      </section>
      <ProductNav active="Readiness" />

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-2">
          {checks.map((group) => (
            <article key={group.group} className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck className="h-5 w-5 text-[#1f8a70]" />
                {group.group}
              </div>
              <ul className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1f8a70]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-md border border-[#dce3dd] bg-white p-5">
          <h2 className="text-lg font-semibold">Server command reminder</h2>
          <pre className="mt-4 overflow-auto rounded-md bg-[#17211d] p-4 text-xs leading-5 text-[#e8f4ef]">
{`cd /root/work/web3/predictguard
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs --tail=80 predictguard
curl -I https://predictguard.xyz
curl -I https://www.predictguard.xyz`}
          </pre>
        </section>
      </div>
    </main>
  );
}
