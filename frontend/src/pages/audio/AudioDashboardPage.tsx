import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  TrendingUp,
  Settings as SettingsIcon,
  Sparkles,
  Loader2,
  Volume2,
  Zap,
  Award,
  Flame,
  Gamepad2,
  ArrowRight,
  Headphones,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  usePageAudio,
  usePageVoiceCommands,
  useAudioNavigation,
} from "../../contexts/AudioNavigationContext";
import { VoiceCommand } from "../../hooks/useVoiceCommands";
import api from "../../lib/api";

interface Attempt {
  id: string;
  textEngagement: number;
  audioEngagement: number;
  visualEngagement: number;
  preferredMode: string;
  scorePercent: number;
  completedAt: string;
}
interface ProgressSummary {
  xp: number;
  streakDays: number;
  badges: Array<{ name: string }>;
}
interface Enrolment {
  classroom: { id: string; name: string };
}

const OPTIONS = [
  { key: "1", label: "Lessons", detail: "Your classroom units, with every lesson read aloud.", path: "/classroom", icon: BookOpen },
  { key: "2", label: "Quiz", detail: "A voice quiz. Questions and options are read aloud.", path: "/dashboard/audio/quiz", icon: ClipboardList },
  { key: "3", label: "My progress", detail: "Your full report card, subject by subject.", path: "/progress", icon: TrendingUp },
  { key: "4", label: "Settings", detail: "Change your profile, text size and narration.", path: "/settings", icon: SettingsIcon },
  { key: "5", label: "AR game", detail: "The 3D balloon game, using this unit's own questions.", path: "/ar-game", icon: Gamepad2 },
] as const;

export const AudioDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    announce,
    enabled: audioNavOn,
    dismissed: audioDismissed,
    setEnabled,
    listening,
    registerNumberedTargets,
  } = useAudioNavigation();

  const [history, setHistory] = useState<Attempt[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/assessments/history"),
      api.get("/progress"),
      api.get("/classrooms/mine/enrolment"),
    ])
      .then(([hist, prog, enr]) => {
        setHistory(hist.data.attempts || []);
        setProgress(prog.data);
        setEnrolment(enr.data.enrolment);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const latest = history[0];

  const stats = useMemo(
    () => [
      { label: "Experience points", short: "XP", value: progress?.xp ?? 0, icon: Zap, color: "text-amber-500 bg-amber-50 border-amber-200" },
      { label: "Assessments taken", short: "Assessments", value: history.length, icon: BookOpen, color: "text-sky-600 bg-sky-50 border-sky-200" },
      { label: "Day streak", short: "Streak", value: progress?.streakDays ?? 0, icon: Flame, color: "text-rose-500 bg-rose-50 border-rose-200" },
      { label: "Badges earned", short: "Badges", value: progress?.badges?.length ?? 0, icon: Award, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    ],
    [progress, history.length],
  );

  const modes = useMemo(
    () =>
      latest
        ? [
            { key: "VISUAL", label: "Visual", score: Math.round(latest.visualEngagement), barColor: "bg-sky-500" },
            { key: "AUDIO", label: "Audio", score: Math.round(latest.audioEngagement), barColor: "bg-amber-500" },
            { key: "TEXT", label: "Text", score: Math.round(latest.textEngagement), barColor: "bg-purple-500" },
          ]
        : [],
    [latest],
  );

  const menuScript = useMemo(
    () =>
      `There are ${OPTIONS.length} choices. ` +
      OPTIONS.map((o) => `${o.key}, ${o.label}. ${o.detail}`).join(" ") +
      " Say the number, or press that number key.",
    [],
  );

  usePageAudio("Audio dashboard", () => {
    const name = user?.name ? `, ${user.name.split(" ")[0]}` : "";
    const parts = [`Welcome back${name}.`];

    if (loadError) parts.push("Your latest data could not be loaded. Check your connection and reload.");
    parts.push(enrolment ? `You are in the classroom ${enrolment.classroom.name}.` : "You have not joined a classroom yet.");
    parts.push(
      `You have ${progress?.xp ?? 0} experience points, a ${progress?.streakDays ?? 0} day streak, ` +
        `${progress?.badges?.length ?? 0} badges, and you have taken ${history.length} assessments.`,
    );

    if (latest) {
      parts.push(
        `Your learning profile: ` +
          modes.map((m) => `${m.label} ${m.score} percent`).join(", ") +
          `. You engage best in ${latest.preferredMode} mode.`,
      );
      parts.push(`Your most recent assessment scored ${Math.round(latest.scorePercent)} percent.`);
    } else {
      parts.push("You have not taken the adaptive assessment yet, so you have no learning profile.");
    }

    parts.push(menuScript);
    return parts.join(" ");
  });

  useEffect(() => {
    registerNumberedTargets(
      OPTIONS.map((o) => ({
        label: o.label,
        run: () => navigate(o.path),
      })),
    );
    return () => registerNumberedTargets(null);
  }, [registerNumberedTargets, navigate]);

  const pageCommands: VoiceCommand[] = useMemo(
    () => [
      ...OPTIONS.map((o) => ({
        phrases: [o.label.toLowerCase()],
        description: `${o.key} — ${o.label}`,
        run: () => {
          announce(`Opening ${o.label}`);
          navigate(o.path);
        },
      })),
      { phrases: ["menu", "options", "what are my choices", "read menu"], description: "Read the menu again", run: () => announce(menuScript) },
      {
        phrases: ["my stats", "my scores", "how am i doing"],
        description: "Read your stats",
        run: () =>
          announce(
            `You have ${progress?.xp ?? 0} experience points, a ${progress?.streakDays ?? 0} day streak, ` +
              `${progress?.badges?.length ?? 0} badges, and ${history.length} assessments taken.` +
              (latest ? ` You engage best in ${latest.preferredMode} mode.` : ""),
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, announce, menuScript, progress, history.length, latest],
  );
  usePageVoiceCommands(pageCommands);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" aria-hidden="true" />
        <span className="sr-only">Loading your dashboard</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 font-sans pb-32 selection:bg-emerald-100 selection:text-emerald-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-emerald-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
      >
        Skip to main content
      </a>

      <header className="bg-white px-6 py-5 border-b border-slate-200/80 shadow-xs sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">Audio Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">
              Welcome back, <strong className="text-slate-900">{user?.name?.split(" ")[0] || "Learner"}</strong>. Press a number key or say the number.
            </p>
          </div>
          <div>
            {enrolment ? (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> {enrolment.classroom.name}
              </span>
            ) : (
              <Link to="/recommendation" className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline">
                Join a classroom
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {loadError && (
          <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold">
            Couldn&apos;t load your latest data — check your connection and reload the page.
          </div>
        )}

        {!audioNavOn && !audioDismissed && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Audio navigation is currently off</p>
                <p className="text-xs text-amber-700 mt-0.5">Turn it on to hear screen descriptions and use voice commands.</p>
              </div>
            </div>
            <button
              onClick={() => setEnabled(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" /> Turn on audio navigation
            </button>
          </div>
        )}

        {/* Progress Stats Grid */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Your Progress Summary
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4 list-none p-0">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <li
                  key={stat.label}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-1"
                >
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center mb-1 ${stat.color}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500 font-medium">{stat.short}</div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Learning Profile Section */}
        <section aria-labelledby="profile-heading" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
          <h2 id="profile-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Your Learning Profile
          </h2>
          {latest ? (
            <div className="space-y-4">
              <ul className="space-y-3 list-none p-0">
                {modes.map((m) => {
                  const preferred = latest.preferredMode === m.key;
                  return (
                    <li
                      key={m.key}
                      className={`p-4 rounded-2xl border transition-all ${
                        preferred ? "bg-emerald-50/70 border-emerald-300 shadow-xs" : "bg-[#FAF9F5] border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-2">
                        <span className="flex items-center gap-2">
                          {m.label}
                          {preferred && (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Preferred Mode
                            </span>
                          )}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{m.score}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
                        <div className={`h-full rounded-full transition-all duration-500 ${m.barColor}`} style={{ width: `${m.score}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="text-xs text-slate-600 font-medium">
                Most recent assessment score: <strong className="text-slate-900 font-bold">{Math.round(latest.scorePercent)}%</strong>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#FAF9F5] border border-slate-200 text-center space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                You haven&apos;t taken the adaptive assessment yet. Take the voice quiz to unlock your profile.
              </p>
              <button
                onClick={() => navigate("/dashboard/audio/quiz")}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Take the Voice Quiz
              </button>
            </div>
          )}
        </section>

        {/* Action Menu */}
        <section aria-labelledby="menu-heading">
          <h2 id="menu-heading" className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-600" />
            What would you like to do?
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0">
            {OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <li key={option.key}>
                  <button
                    onClick={() => {
                      announce(`Opening ${option.label}`);
                      navigate(option.path);
                    }}
                    className="w-full h-full text-left p-5 rounded-3xl bg-white hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md cursor-pointer group flex items-start gap-4"
                  >
                    <span
                      aria-hidden="true"
                      className="w-10 h-10 shrink-0 rounded-2xl bg-[#FAF9F5] border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors"
                    >
                      {option.key}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-base mb-1">
                        <Icon className="w-4.5 h-4.5 text-slate-600 group-hover:text-emerald-600 transition-colors" aria-hidden="true" />
                        <span>{option.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{option.detail}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Recent Assessments */}
        <section aria-labelledby="recent-heading" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
          <h2 id="recent-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Recent Assessment Attempts
          </h2>
          {history.length > 0 ? (
            <ul className="space-y-2.5 list-none p-0">
              {history.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF9F5] border border-slate-200/80 text-xs font-semibold"
                >
                  <span className="text-slate-700">
                    {new Date(a.completedAt).toLocaleDateString()} · <strong className="text-slate-900 uppercase">{a.preferredMode}</strong> mode
                  </span>
                  <span className="text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    {Math.round(a.scorePercent)}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No assessment attempts recorded yet.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default AudioDashboardPage;
