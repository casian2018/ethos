import type { ReactNode } from "react";
import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Droplets,
  Dumbbell,
  HeartPulse,
  MoonStar,
  Sparkles,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const proofPoints = [
  { value: "1 profile", label: "drives training, nutrition, recovery, and social recommendations" },
  { value: "4 engines", label: "working from the same body context instead of siloed forms" },
  { value: "live loops", label: "daily actions that keep the product moving instead of sitting idle" },
];

const engineCards = [
  {
    title: "Training adapts to reality",
    description: "Goals, injuries, equipment, sleep, and stress all shape the workout generator.",
    icon: Dumbbell,
    accent: "from-orange-500/25 to-amber-300/10",
  },
  {
    title: "Nutrition speaks the same language",
    description: "Calories, macros, hydration, food photos, and meal plans pull from the same profile spine.",
    icon: Apple,
    accent: "from-emerald-500/22 to-orange-300/10",
  },
  {
    title: "Recovery is not an afterthought",
    description: "Readiness and sleep stop being disconnected charts and start steering the daily plan.",
    icon: MoonStar,
    accent: "from-sky-500/20 to-emerald-300/10",
  },
  {
    title: "People enter at the right moment",
    description: "Find a Buddy is about real sessions and actual availability, not dead profile grids.",
    icon: Users,
    accent: "from-violet-500/18 to-orange-300/10",
  },
];

const dayMoments = [
  {
    step: "01",
    label: "Wake",
    title: "Recovery sets the tone.",
    description: "Readiness, sleep signals, and hydration targets show up before you make a single decision.",
    points: ["readiness pulse", "water target", "goal-aware daily focus"],
  },
  {
    step: "02",
    label: "Move",
    title: "Training stops feeling generic.",
    description: "The session fits the actual day: equipment, time, stress, soreness, and the goal you care about most.",
    points: ["adaptive workout", "context from profile", "realistic volume"],
  },
  {
    step: "03",
    label: "Eat",
    title: "Nutrition becomes visible.",
    description: "Log by text or photo, estimate the meal, and compare the day you planned with the day you lived.",
    points: ["photo meal analysis", "macro drift", "saved meal plans"],
  },
];

const socialMoments = [
  {
    title: "Live slots over dead profiles",
    description: "You are not browsing a cemetery of abandoned accounts. You join actual sessions.",
  },
  {
    title: "Community tied to the routine",
    description: "Buddy matching sits next to training and nutrition, so the product compounds instead of fragmenting.",
  },
  {
    title: "A warmer interface by design",
    description: "Ethos leans into atmosphere, depth, and presence instead of sterile utility screens.",
  },
];

function SlideFrame({
  children,
  className = "",
  heightClass = "min-h-[130vh]",
}: {
  children: ReactNode;
  className?: string;
  heightClass?: string;
}) {
  return (
    <section className={`relative py-3 sm:py-6 ${heightClass}`}>
      <div
        className={`sticky top-3 min-h-[calc(100svh-1.5rem)] overflow-hidden rounded-[2rem] border border-slate-200/80 shadow-[0_32px_90px_rgba(17,31,30,0.12)] sm:top-6 sm:min-h-[calc(100svh-3rem)] sm:rounded-[2.6rem] ${className}`}
      >
        {children}
      </div>
    </section>
  );
}

function MetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.6rem] border border-white/60 bg-white/72 p-4 backdrop-blur-md sm:p-5">
      <p className="ethos-display text-2xl font-semibold text-slate-900 sm:text-3xl">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{label}</p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative overflow-x-hidden px-3 pb-8 pt-3 sm:px-6 sm:pb-12 lg:px-8">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,186,145,0.12),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(240,116,62,0.14),transparent_22%),linear-gradient(180deg,rgba(255,251,246,0.94),rgba(244,238,230,0.98))]" />
        <div className="absolute left-[-10rem] top-[18rem] h-[28rem] w-[28rem] rounded-full bg-emerald-300/20 blur-[110px]" />
        <div className="absolute right-[-8rem] top-[-2rem] h-[24rem] w-[24rem] rounded-full bg-orange-300/25 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="sticky top-3 z-50 mb-3 rounded-[1.75rem] border border-slate-200/80 bg-white/78 px-4 py-3 shadow-[0_18px_45px_rgba(17,31,30,0.08)] backdrop-blur-xl sm:top-6 sm:mb-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-gradient-to-br from-orange-500 to-emerald-500 text-white shadow-[0_16px_32px_rgba(240,116,62,0.22)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-500">Ethos</p>
                <p className="text-sm font-semibold text-slate-900">Athletic operating system</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <ThemeToggle className="justify-center sm:justify-start" />
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start your profile
              </Link>
            </div>
          </div>
        </header>

        <SlideFrame
          heightClass="min-h-[118vh]"
          className="bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.88),rgba(255,248,242,0.62)_40%,rgba(240,116,62,0.18)_100%)]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.35),transparent_34%,rgba(16,33,31,0.03)_100%)]" />
          <div className="absolute -right-16 top-20 h-72 w-72 rounded-full bg-orange-300/20 blur-[100px]" />
          <div className="absolute -left-12 bottom-12 h-80 w-80 rounded-full bg-emerald-300/18 blur-[120px]" />

          <div className="relative grid min-h-[calc(100svh-1.5rem)] gap-8 px-5 py-6 sm:min-h-[calc(100svh-3rem)] sm:px-8 sm:py-9 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-12">
            <div className="flex flex-col justify-between">
              <div>
                <div className="ethos-kicker">
                  <HeartPulse className="h-3.5 w-3.5" />
                  Scroll like a keynote
                </div>
                <h1 className="ethos-display mt-6 max-w-4xl text-[3rem] font-semibold leading-[0.88] tracking-[-0.06em] text-slate-900 sm:text-[4.6rem] lg:text-[6.4rem]">
                  Fitness should unfold like a presentation, not collapse into a dashboard.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  Ethos is built to feel cinematic on scroll: one profile, one system, and a sequence of moments that
                  makes training, nutrition, recovery, and community feel like part of the same story.
                </p>
              </div>

              <div className="mt-8">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/auth"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(240,116,62,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/90"
                  >
                    Enter Ethos
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/dev/find_a_buddy"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  >
                    Explore live sessions
                  </Link>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {proofPoints.map((item) => (
                    <MetricTile key={item.value} value={item.value} label={item.label} />
                  ))}
                </div>
              </div>
            </div>

            <div className="relative min-h-[26rem] lg:min-h-full">
              <div className="absolute inset-x-0 top-0 h-40 rounded-[2rem] bg-white/40 blur-3xl" />

              <div
                className="absolute left-0 top-6 w-[88%] rounded-[2rem] border border-white/60 bg-[#10211f] p-5 text-white shadow-[0_32px_80px_rgba(16,33,31,0.24)] backdrop-blur-xl animate-ethos-float sm:p-6"
                style={{ animationDelay: "0s" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Today in motion</p>
                    <h2 className="mt-3 ethos-display text-4xl font-semibold sm:text-5xl">84</h2>
                    <p className="mt-1 text-sm text-white/70">readiness score with nutrition and hydration context</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-3 py-2 text-right">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/55">Live</p>
                    <p className="mt-2 text-2xl font-semibold">3 sessions</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    "Workout adapts volume because sleep dropped last night.",
                    "Meal target tightens because your goal is body recomposition.",
                    "Buddy slots surface because your real window opens at 18:30.",
                  ].map((item) => (
                    <div key={item} className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/78">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="absolute right-0 top-0 w-[58%] rounded-[1.7rem] border border-white/70 bg-white/82 p-4 shadow-[0_22px_55px_rgba(17,31,30,0.12)] backdrop-blur-xl animate-ethos-float"
                style={{ animationDelay: "1.1s" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-emerald-100 text-emerald-700">
                    <MoonStar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Recovery</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">Sleep is steering today</p>
                  </div>
                </div>
              </div>

              <div
                className="absolute bottom-0 right-6 w-[72%] rounded-[1.8rem] border border-white/60 bg-white/84 p-5 shadow-[0_24px_60px_rgba(17,31,30,0.14)] backdrop-blur-xl animate-ethos-float"
                style={{ animationDelay: "2.1s" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Nutrition layer</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">Photo meal logging</h3>
                  </div>
                  <Apple className="h-5 w-5 text-orange-500" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { value: "2130", label: "kcal" },
                    { value: "154g", label: "protein" },
                    { value: "3.0L", label: "water" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1rem] bg-slate-100 px-3 py-3">
                      <p className="text-lg font-semibold text-slate-900">{item.value}</p>
                      <p className="mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SlideFrame>

        <SlideFrame className="bg-[linear-gradient(145deg,rgba(255,251,246,0.96),rgba(247,239,230,0.82)_48%,rgba(231,244,237,0.82)_100%)]">
          <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[radial-gradient(circle_at_top,rgba(94,186,145,0.2),transparent_55%)] lg:block" />

          <div className="relative grid min-h-[calc(100svh-1.5rem)] gap-8 px-5 py-6 sm:min-h-[calc(100svh-3rem)] sm:px-8 sm:py-9 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-12">
            <div className="flex flex-col justify-between">
              <div>
                <div className="ethos-kicker">One body context</div>
                <h2 className="ethos-section-title mt-6 max-w-3xl text-slate-900">
                  Every engine answers from the same source of truth.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                  The feeling of depth does not come from visual polish alone. It comes from consistency. One profile
                  keeps the product coherent, so every screen feels like the next slide in the same story.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: "sleep", label: "feeds readiness, training load, and recovery guidance" },
                  { value: "goal", label: "changes calorie targets, workout focus, and recommendations" },
                  { value: "availability", label: "powers real sessions instead of generic social cards" },
                ].map((item) => (
                  <div key={item.value} className="rounded-[1.4rem] border border-slate-200/80 bg-white/75 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.value}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {engineCards.map((card, index) => (
                <article
                  key={card.title}
                  className={`rounded-[2rem] border border-white/70 bg-gradient-to-br ${card.accent} p-[1px] shadow-[0_18px_45px_rgba(17,31,30,0.08)]`}
                >
                  <div
                    className="rounded-[calc(2rem-1px)] bg-white/86 p-5 backdrop-blur-xl sm:p-6"
                    style={{
                      transform: `translateX(${index % 2 === 0 ? 0 : 18}px)`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-slate-100 text-slate-900">
                          <card.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Engine {index + 1}</p>
                          <h3 className="mt-1 text-xl font-semibold text-slate-900">{card.title}</h3>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300" />
                    </div>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{card.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </SlideFrame>

        <SlideFrame className="bg-[linear-gradient(160deg,#10211f_0%,#17322f_44%,#f0743e_120%)] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_85%_74%,rgba(255,255,255,0.1),transparent_28%)]" />

          <div className="relative flex min-h-[calc(100svh-1.5rem)] flex-col px-5 py-6 sm:min-h-[calc(100svh-3rem)] sm:px-8 sm:py-9 lg:px-12 lg:py-12">
            <div className="max-w-3xl">
              <div className="ethos-kicker border-white/10 bg-white/6 text-white/75">A day on rails</div>
              <h2 className="ethos-display mt-6 text-[2.6rem] font-semibold leading-[0.9] tracking-[-0.06em] sm:text-[4rem] lg:text-[5.4rem]">
                Scroll through a routine that keeps compounding.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
                The interface is meant to feel like momentum. Morning becomes movement, movement becomes nutrition,
                and nutrition becomes another reason to come back tomorrow.
              </p>
            </div>

            <div className="mt-8 grid flex-1 gap-4 lg:grid-cols-3">
              {dayMoments.map((moment) => (
                <article
                  key={moment.step}
                  className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/7 p-5 backdrop-blur-md sm:p-6"
                >
                  <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-white/0 via-white/30 to-white/0" />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">{moment.label}</p>
                      <span className="ethos-display text-4xl font-semibold text-white/18">{moment.step}</span>
                    </div>
                    <h3 className="mt-10 text-2xl font-semibold text-white sm:text-3xl">{moment.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/72">{moment.description}</p>

                    <div className="mt-8 space-y-3">
                      {moment.points.map((item) => (
                        <div
                          key={item}
                          className="rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/78"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </SlideFrame>

        <SlideFrame className="bg-[linear-gradient(145deg,rgba(255,252,248,0.95),rgba(248,243,236,0.9)_52%,rgba(255,250,244,0.95))]">
          <div className="absolute right-[-8rem] top-[12%] h-80 w-80 rounded-full bg-orange-300/14 blur-[120px]" />
          <div className="absolute left-[-10rem] bottom-[8%] h-[26rem] w-[26rem] rounded-full bg-emerald-300/18 blur-[120px]" />

          <div className="relative grid min-h-[calc(100svh-1.5rem)] gap-8 px-5 py-6 sm:min-h-[calc(100svh-3rem)] sm:px-8 sm:py-9 lg:grid-cols-[1.08fr_0.92fr] lg:px-12 lg:py-12">
            <div className="rounded-[2.2rem] border border-slate-200/80 bg-slate-900 p-6 text-white shadow-[0_30px_80px_rgba(17,31,30,0.18)] sm:p-8">
              <div className="ethos-kicker border-white/10 bg-white/6 text-white/70">Social by design</div>
              <h2 className="ethos-display mt-6 text-[2.6rem] font-semibold leading-[0.9] tracking-[-0.05em] sm:text-[4rem]">
                Community should feel wired into the system, not stapled on the side.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
                Ethos treats people like live energy inside the routine. That makes the product feel more magnetic as
                you move down the page, because the promise is not abstract. It is already happening.
              </p>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "18:30", value: "open buddy session" },
                  { label: "92%", value: "match strength from real overlap" },
                  { label: "1 tap", value: "from suggestion to join flow" },
                  { label: "0 dead ends", value: "because the session exists before the chat" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.3rem] border border-white/10 bg-white/6 p-4">
                    <p className="ethos-display text-3xl font-semibold text-white">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {socialMoments.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[2rem] border border-slate-200/80 bg-white/76 p-5 shadow-[0_18px_45px_rgba(17,31,30,0.08)] backdrop-blur-md sm:p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Why it lands</p>
                  <h3 className="mt-3 text-2xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              ))}

              <div className="rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-emerald-100/85 via-white/85 to-orange-100/75 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Explore the loops</p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href="/dev/train/workout"
                    className="inline-flex items-center justify-between rounded-[1.2rem] border border-white/70 bg-white/70 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:bg-white"
                  >
                    Workout generator
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/dev/nutrition"
                    className="inline-flex items-center justify-between rounded-[1.2rem] border border-white/70 bg-white/70 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:bg-white"
                  >
                    Nutrition engine
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/dev/find_a_buddy"
                    className="inline-flex items-center justify-between rounded-[1.2rem] border border-white/70 bg-white/70 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:bg-white"
                  >
                    Find a Buddy
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </SlideFrame>

        <SlideFrame
          heightClass="min-h-[100vh]"
          className="bg-[linear-gradient(160deg,#0d1716_0%,#10211f_45%,#173330_100%)] text-white"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(240,116,62,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(94,186,145,0.16),transparent_28%)]" />

          <div className="relative flex min-h-[calc(100svh-1.5rem)] flex-col justify-between px-5 py-6 sm:min-h-[calc(100svh-3rem)] sm:px-8 sm:py-9 lg:px-12 lg:py-12">
            <div className="max-w-4xl">
              <div className="ethos-kicker border-white/10 bg-white/5 text-white/70">Final slide</div>
              <h2 className="ethos-display mt-6 text-[3rem] font-semibold leading-[0.9] tracking-[-0.06em] text-white sm:text-[4.6rem] lg:text-[6rem]">
                The system was already there. Now the landing finally performs like the product deserves.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                Enter Ethos, build the profile once, and let the rest of the product start feeling connected.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur-md sm:p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { icon: Dumbbell, label: "train with context" },
                    { icon: Droplets, label: "track hydration and nutrition" },
                    { icon: Users, label: "join live social sessions" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.4rem] border border-white/10 bg-black/10 p-4">
                      <item.icon className="h-5 w-5 text-white/70" />
                      <p className="mt-4 text-sm leading-6 text-white/80">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Open Ethos
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dev/nutrition"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  See the nutrition layer
                </Link>
              </div>
            </div>
          </div>
        </SlideFrame>
      </div>
    </main>
  );
}
