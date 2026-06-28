import { ClipboardList, MessageSquareText, Target } from "lucide-react";

import { ProductNav } from "@/app/product-nav";

const personas = [
  "DeepBook Predict LP",
  "Vault builder",
  "Market maker",
  "Risk analyst",
  "Protocol ecosystem partner",
];

const questions = [
  "What risk question do you need answered before allocating liquidity?",
  "Which report section would you share with LPs or partners?",
  "Which monitoring alert would change your behavior?",
  "What evidence is required before trusting a hedge lifecycle state?",
  "Would you pay for reports, monitoring, API access, or managed integration?",
];

const metrics = [
  "User can explain max payout liability after one report",
  "User exports or saves a snapshot",
  "User configures a monitoring preset",
  "User asks for multi-manager support",
  "User requests adapter support beyond DeepBook Predict",
];

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211d]">
      <section className="border-b border-[#dce3dd] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <a href="/" className="text-sm font-semibold text-[#1f8a70] transition hover:text-[#17211d]">
            Back to dashboard
          </a>
          <div className="mt-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dce3dd] bg-[#f5f7f4] px-3 py-1 text-sm font-medium text-[#1f8a70]">
              <MessageSquareText className="h-4 w-4" />
              Customer discovery
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
              Validate demand before adding heavy infrastructure
            </h1>
            <p className="mt-4 text-base leading-7 text-[#52615a]">
              PredictGuard should validate whether teams value reports,
              monitoring, lifecycle evidence, adapters, or automation before
              investing in production indexers and paid SaaS infrastructure.
            </p>
          </div>
        </div>
      </section>
      <ProductNav />

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-3">
          <Panel title="Target Personas" icon={<Target className="h-5 w-5" />}>
            <List items={personas} />
          </Panel>
          <Panel title="Interview Questions" icon={<MessageSquareText className="h-5 w-5" />}>
            <List items={questions} />
          </Panel>
          <Panel title="Validation Signals" icon={<ClipboardList className="h-5 w-5" />}>
            <List items={metrics} />
          </Panel>
        </section>

        <section className="rounded-md border border-[#dce3dd] bg-white p-5">
          <h2 className="text-lg font-semibold">Feedback capture template</h2>
          <pre className="mt-4 overflow-auto rounded-md bg-[#17211d] p-4 text-xs leading-5 text-[#e8f4ef]">
{`Persona:
Current workflow:
Risk question:
Report sections that mattered:
Monitoring rule that mattered:
Missing evidence:
Willingness to pay:
Next requested feature:`}
          </pre>
        </section>
      </div>
    </main>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
      <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <span className="text-[#1f8a70]">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-6">
      {items.map((item) => (
        <li key={item} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-3">
          {item}
        </li>
      ))}
    </ul>
  );
}
