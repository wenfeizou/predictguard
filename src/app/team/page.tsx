import { BriefcaseBusiness, CheckCircle2, ShieldCheck, Users } from "lucide-react";

import { ProductNav } from "@/app/product-nav";

const roles = [
  {
    name: "Owner",
    permissions: ["Manage workspace", "Connect managers", "Export reports", "Configure monitoring"],
  },
  {
    name: "Risk reviewer",
    permissions: ["Review snapshots", "Comment on lifecycle queue", "Export reports"],
  },
  {
    name: "Operator",
    permissions: ["Run wallet workflow", "Save snapshots", "Resolve monitoring queue"],
  },
];

const queue = [
  "Review high-liability snapshot",
  "Confirm settlement evidence for expired positions",
  "Approve monitoring preset change",
  "Prepare LP-facing weekly risk report",
];

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211d]">
      <section className="border-b border-[#dce3dd] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <a href="/" className="text-sm font-semibold text-[#1f8a70] transition hover:text-[#17211d]">
            Back to dashboard
          </a>
          <div className="mt-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dce3dd] bg-[#f5f7f4] px-3 py-1 text-sm font-medium text-[#1f8a70]">
              <Users className="h-4 w-4" />
              Team workspace draft
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
              Team workflow for vault risk operations
            </h1>
            <p className="mt-4 text-base leading-7 text-[#52615a]">
              PredictGuard should support teams that separate wallet execution,
              risk review, monitoring, and LP-facing reporting. This page defines
              the workspace model before backend auth is added.
            </p>
          </div>
        </div>
      </section>
      <ProductNav />

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-3">
          {roles.map((role) => (
            <article key={role.name} className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck className="h-5 w-5 text-[#1f8a70]" />
                {role.name}
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6">
                {role.permissions.map((permission) => (
                  <li key={permission} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1f8a70]" />
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-md border border-[#dce3dd] bg-white p-5">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <BriefcaseBusiness className="h-5 w-5 text-[#1f8a70]" />
              Review queue
            </div>
            <div className="mt-4 space-y-3">
              {queue.map((item, index) => (
                <div key={item} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3 text-sm">
                  <span className="font-semibold">#{index + 1}</span> {item}
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-md border border-[#dce3dd] bg-white p-5">
            <h2 className="text-lg font-semibold">Workspace boundaries</h2>
            <p className="mt-3 text-sm leading-6 text-[#52615a]">
              Team workspace features should not custody funds or sign
              transactions. They coordinate evidence, reporting, review state,
              and monitoring policies while the connected wallet remains the
              execution authority.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Boundary label="Non-custodial" />
              <Boundary label="Wallet-owned signing" />
              <Boundary label="Auditable reports" />
              <Boundary label="Role-based review" />
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function Boundary({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3 text-sm font-semibold">
      {label}
    </div>
  );
}
