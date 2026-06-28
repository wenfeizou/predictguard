import { Bot, FileText, ShieldCheck } from "lucide-react";

const modes = [
  {
    title: "Risk reviewer",
    detail: "Explain exposure, tail scenarios, assumptions, and residual risk for internal review.",
  },
  {
    title: "LP-facing report",
    detail: "Rewrite deterministic evidence into clearer language for liquidity providers.",
  },
  {
    title: "Operator checklist",
    detail: "Turn monitoring breaches and lifecycle queues into next-action checklists.",
  },
];

const guardrails = [
  "Do not predict price direction.",
  "Do not promise profit, protection, or guaranteed payout.",
  "Always cite assumptions and data source mode.",
  "Separate executed evidence from simulated scenario output.",
  "Describe wallet signing as user-controlled and non-custodial.",
  "Label missing settlement or redeem evidence explicitly.",
];

export default function CopilotPage() {
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
              <Bot className="h-4 w-4" />
              AI risk copilot guardrails
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
              AI explanations for evidence-backed risk review
            </h1>
            <p className="mt-4 text-base leading-7 text-[#52615a]">
              The copilot should make PredictGuard easier to understand without
              becoming a black-box trading assistant. It explains evidence,
              assumptions, residual risk, and operator actions.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-3">
          {modes.map((mode) => (
            <article key={mode.title} className="rounded-md border border-[#dce3dd] bg-white p-5 shadow-[0_10px_30px_rgba(23,33,29,0.08)]">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5 text-[#1f8a70]" />
                {mode.title}
              </div>
              <p className="mt-3 text-sm leading-6 text-[#52615a]">{mode.detail}</p>
            </article>
          ))}
        </section>

        <section className="rounded-md border border-[#dce3dd] bg-white p-5">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-[#1f8a70]" />
            Guardrail checklist
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {guardrails.map((item) => (
              <div key={item} className="rounded-md border border-[#dce3dd] bg-[#f5f7f4] p-4 text-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[#dce3dd] bg-white p-5">
          <h2 className="text-lg font-semibold">Prompt contract draft</h2>
          <pre className="mt-4 overflow-auto rounded-md bg-[#17211d] p-4 text-xs leading-5 text-[#e8f4ef]">
{`You are PredictGuard's risk explanation copilot.
Use only provided report evidence.
Separate facts, assumptions, and recommended review actions.
Do not give directional trading advice.
Do not guarantee protection or payout.
When evidence is missing, say exactly what is missing.`}
          </pre>
        </section>
      </div>
    </main>
  );
}
