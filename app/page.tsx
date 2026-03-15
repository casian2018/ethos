import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Dumbbell,
  HeartPulse,
  MoonStar,
  Sparkles,
  Users,
} from "lucide-react";

const experienceCards = [
  {
    title: "AI Training",
    description: "Personalized workouts built from goals, recovery, injuries, and available equipment.",
    icon: Dumbbell,
  },
  {
    title: "Nutrition Engine",
    description: "Meal plans and targets that actually use your profile, calories, hydration, and preferences.",
    icon: Apple,
  },
  {
    title: "Find a Buddy",
    description: "Real sessions, real people, match score, filters, and join flow directly into session chat.",
    icon: Users,
  },
  {
    title: "Recovery Layer",
    description: "Sleep and daily readiness tracked as part of the system, not as an afterthought.",
    icon: MoonStar,
  },
];

const proofPoints = [
  { value: "1 app", label: "training, nutrition, community, recovery" },
  { value: "full profile", label: "used across all recommendation flows" },
  { value: "live sessions", label: "instead of static buddy profiles" },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="ethos-panel rounded-[36px] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-orange-500 to-emerald-500 text-white shadow-[0_14px_32px_rgba(240,116,62,0.22)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ethos</p>
                <h1 className="ethos-display text-3xl font-semibold text-slate-900">Athletic operating system</h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(240,116,62,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/90"
              >
                Start building your profile
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-6 pt-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="ethos-panel rounded-[38px] px-6 py-8 sm:px-8 sm:py-10">
            <div className="ethos-kicker">
              <HeartPulse className="h-3.5 w-3.5" />
              Designed to feel alive
            </div>
            <h2 className="ethos-section-title mt-6 max-w-4xl text-slate-900">
              Not another sterile fitness dashboard.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Ethos combines training, nutrition, recovery, and social sport into one product with a warmer,
              more human interface. The point is not just tracking. The point is momentum.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(240,116,62,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/90"
              >
                Enter the app
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dev/find_a_buddy"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                Explore Find a Buddy
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {proofPoints.map((item) => (
                <div
                  key={item.value}
                  className="rounded-[28px] border border-slate-200/80 bg-white/70 p-5 backdrop-blur"
                >
                  <p className="ethos-display text-3xl font-semibold text-slate-900">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[38px] border border-slate-200/80 bg-gradient-to-br from-[#12211f] via-[#17332f] to-[#f0743e] p-7 text-white shadow-[0_28px_64px_rgba(17,31,30,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Why it feels different</p>
              <h3 className="ethos-display mt-4 text-4xl font-semibold">Warm, sharp, social.</h3>
              <p className="mt-4 text-sm leading-7 text-white/80">
                The visual language is built around movement, texture, contrast, and atmosphere instead of bland
                charts on white cards.
              </p>
            </div>

            <div className="ethos-panel-soft rounded-[38px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Core loops</p>
              <div className="mt-5 space-y-4">
                {[
                  "Build the profile once and use it everywhere.",
                  "Train with recommendations that reflect your real constraints.",
                  "Find people by actual session availability, not dead profiles.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[24px] bg-white/72 p-4">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-orange-500 to-emerald-500" />
                    <p className="text-sm leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pt-6">
          <div className="ethos-panel rounded-[38px] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="ethos-kicker">Inside Ethos</div>
                <h2 className="ethos-section-title mt-5 text-slate-900">A single system, not isolated tools.</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-600">
                Every module shares context, which means the product feels intentional from the first screen to the
                last.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {experienceCards.map((card) => (
                <article
                  key={card.title}
                  className="ethos-card-lift rounded-[30px] border border-slate-200/80 bg-white/78 p-6 shadow-[0_16px_36px_rgba(17,31,30,0.06)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-100 text-slate-800">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-6">
          <div className="rounded-[40px] border border-slate-200/80 bg-slate-900 px-6 py-8 text-white shadow-[0_32px_80px_rgba(17,31,30,0.16)] sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="ethos-kicker border-white/10 bg-white/5 text-white/70">Ready to make it special</div>
                <h2 className="ethos-section-title mt-6 text-white">The product already has the system. Now it has the presence.</h2>
              </div>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Open Ethos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
