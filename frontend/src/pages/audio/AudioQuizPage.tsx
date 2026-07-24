import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Volume2,
  Square,
  ArrowLeft,
  Loader2,
  Trophy,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSpeech } from "../../hooks/useSpeech";
import {
  useAudioNavigation,
  usePageVoiceCommands,
} from "../../contexts/AudioNavigationContext";
import { VoiceCommand } from "../../hooks/useVoiceCommands";
import api from "../../lib/api";

interface VoiceQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
  subject: string;
}

const AUDIO_QUESTIONS: VoiceQuestion[] = [
  { id: "b1", question: "What is 5 plus 3?", options: ["6", "7", "8", "9"], answer: "8", subject: "Math" },
  { id: "b2", question: "What sound does a dog make?", options: ["Meow", "Woof", "Moo", "Quack"], answer: "Woof", subject: "Sounds" },
  { id: "b3", question: "How many legs does a spider have?", options: ["Six", "Eight", "Ten", "Four"], answer: "Eight", subject: "Nature" },
  { id: "b4", question: "Which gas do humans need to breathe to live?", options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Helium"], answer: "Oxygen", subject: "Biology" },
  { id: "b5", question: "What is 12 minus 4?", options: ["6", "7", "8", "9"], answer: "8", subject: "Math" },
  { id: "b6", question: "How many days are in a leap year?", options: ["364", "365", "366", "367"], answer: "366", subject: "General Knowledge" },
  { id: "b7", question: "What is the freezing point of water in Celsius?", options: ["Zero degrees", "Ten degrees", "Thirty two degrees", "One hundred degrees"], answer: "Zero degrees", subject: "Science" },
  { id: "b8", question: "What is 4 times 3?", options: ["10", "12", "14", "16"], answer: "12", subject: "Math" },
];

const LETTERS = ["A", "B", "C", "D"];
const NEXT_QUESTION_DELAY_MS = 3500;

export const AudioQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { speak, stop: stopSpeaking, blocked } = useSpeech();

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const attemptIdRef = useRef<string | null>(null);
  const startedAtRef = useRef(Date.now());
  const completedRef = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const question = AUDIO_QUESTIONS[index];
  const isLast = index >= AUDIO_QUESTIONS.length - 1;

  useEffect(() => {
    api
      .post("/assessments/start")
      .then(({ data }) => {
        attemptIdRef.current = data.attemptId;
      })
      .catch(() => undefined);
  }, []);

  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      stopSpeaking();
    },
    [stopSpeaking],
  );

  const announce = useCallback(
    (text: string) => {
      setAnnouncement(text);
      speak(text);
    },
    [speak],
  );

  const questionScript = useCallback(
    (q: VoiceQuestion, position: number) =>
      `Question ${position + 1} of ${AUDIO_QUESTIONS.length}. ${q.question} ` +
      q.options.map((opt, i) => `Option ${LETTERS[i]}: ${opt}.`).join(" ") +
      " Say your answer, for example: option A.",
    [],
  );

  const finish = useCallback(
    async (finalScore: number) => {
      if (completedRef.current) return;
      completedRef.current = true;
      setSubmitting(true);
      const summary = `Quiz complete. You scored ${finalScore} out of ${AUDIO_QUESTIONS.length}.`;
      setFinished(true);
      announce(summary);
      try {
        if (attemptIdRef.current) {
          await api.post(`/assessments/${attemptIdRef.current}/complete`, {
            modeEngagement: {
              TEXT: { totalScore: 0, samples: 0, focusedSamples: 0 },
              AUDIO: { totalScore: 0, samples: 0, focusedSamples: 0 },
              VISUAL: { totalScore: 0, samples: 0, focusedSamples: 0 },
            },
            preferredMode: "AUDIO",
            adaptationCount: 0,
            scoreCorrect: finalScore,
            scoreTotal: AUDIO_QUESTIONS.length,
            durationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
          });
        }
        await refreshUser();
      } catch {
        /* score already spoken */
      } finally {
        setSubmitting(false);
      }
    },
    [announce, refreshUser],
  );

  const answerWith = useCallback(
    (choiceIndex: number) => {
      if (answered || finished || !question) return;
      const chosen = question.options[choiceIndex];
      if (chosen === undefined) return;

      setSelectedIdx(choiceIndex);
      setAnswered(true);
      const correct = chosen === question.answer;
      const nextScore = correct ? score + 1 : score;
      if (correct) setScore(nextScore);

      const feedback = correct
        ? `You selected option ${LETTERS[choiceIndex]}, ${chosen}. That is correct.`
        : `You selected option ${LETTERS[choiceIndex]}, ${chosen}. That is not right. The correct answer is ${question.answer}.`;
      announce(feedback);

      if (attemptIdRef.current) {
        api
          .post(`/assessments/${attemptIdRef.current}/answer`, {
            questionId: question.id,
            answer: chosen,
            correct,
            mode: "AUDIO",
          })
          .catch(() => undefined);
      }

      advanceTimerRef.current = setTimeout(() => {
        if (isLast) {
          finish(nextScore);
        } else {
          const nextIndex = index + 1;
          setIndex(nextIndex);
          setSelectedIdx(null);
          setAnswered(false);
          announce(questionScript(AUDIO_QUESTIONS[nextIndex], nextIndex));
        }
      }, NEXT_QUESTION_DELAY_MS);
    },
    [answered, finished, question, score, announce, isLast, index, finish, questionScript],
  );

  const commands: VoiceCommand[] = useMemo(() => {
    const optionCommands: VoiceCommand[] = LETTERS.map((letter, i) => {
      const lower = letter.toLowerCase();
      const numStr = String(i + 1);
      return {
        phrases: [
          `option ${lower}`,
          `answer ${lower}`,
          `choice ${lower}`,
          `select ${lower}`,
          `option ${numStr}`,
          `answer ${numStr}`,
          numStr,
          lower,
        ],
        description: `Answer ${letter}`,
        run: () => answerWith(i),
      };
    });
    return [
      ...optionCommands,
      {
        phrases: ["repeat", "again", "say again", "read question", "repeat question"],
        description: "Repeat the question",
        run: () => question && announce(questionScript(question, index)),
      },
      { phrases: ["stop", "be quiet", "stop reading", "stop audio"], description: "Stop reading", run: () => stopSpeaking() },
      { phrases: ["go back", "exit", "leave quiz", "exit quiz"], description: "Leave the quiz", run: () => { stopSpeaking(); navigate("/dashboard"); } },
    ];
  }, [answerWith, question, announce, questionScript, index, stopSpeaking, navigate]);

  usePageVoiceCommands(commands);
  const { listening, toggleMic: toggle, micSupported: supported, micError: voiceError, lastHeard } = useAudioNavigation();

  const beginQuiz = useCallback(() => {
    setStarted(true);
    if (question) {
      announce(
        `Voice quiz. ${AUDIO_QUESTIONS.length} questions. Turn on voice control, or use the buttons. ` +
          questionScript(question, 0),
      );
    }
  }, [question, announce, questionScript]);

  if (!started) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-slate-800 font-sans flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
        <header className="bg-white px-6 py-4 border-b border-slate-200/80 shadow-xs flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-2xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Audio Assessment Mode
          </span>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <Volume2 className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                Voice Adaptive Quiz
              </h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {AUDIO_QUESTIONS.length} questions. Every question and answer is read aloud automatically with full voice control support.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 text-slate-600 font-medium">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> How it works:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Listen to each question read aloud</li>
                <li>Say &ldquo;option A&rdquo;, &ldquo;B&rdquo;, &ldquo;C&rdquo;, or &ldquo;D&rdquo;</li>
                <li>Or click any option button directly</li>
              </ul>
            </div>

            <button
              autoFocus
              onClick={beginQuiz}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Volume2 className="w-5 h-5" /> Start Quiz Now
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (finished) {
    const percent = Math.round((score / AUDIO_QUESTIONS.length) * 100);
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-slate-800 font-sans flex flex-col justify-between">
        <div aria-live="assertive" aria-atomic="true" className="sr-only">
          {announcement}
        </div>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Quiz Complete!
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                You scored <strong className="text-slate-900">{score}</strong> out of {AUDIO_QUESTIONS.length} ({percent}%).
              </p>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => speak(`You scored ${score} out of ${AUDIO_QUESTIONS.length}.`)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-sky-600" /> Speak Score
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 font-sans flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <header className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 border-b border-slate-200 shadow-xs">
        <button
          onClick={() => { stopSpeaking(); navigate("/dashboard"); }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-2xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-600">
            Question {index + 1} of {AUDIO_QUESTIONS.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            Score: {score}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-6 flex flex-col justify-center">
        {/* Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => question && announce(questionScript(question, index))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-sky-600" /> Repeat Question
          </button>
          <button
            onClick={() => { stopSpeaking(); setAnnouncement("Stopped reading."); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <Square className="w-4 h-4 text-slate-500" /> Stop Audio
          </button>
          <button
            onClick={toggle}
            aria-pressed={listening}
            disabled={!supported}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
              listening
                ? "bg-rose-50 border-rose-300 text-rose-800 animate-pulse"
                : "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            {listening ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4 text-emerald-600" />}
            {listening ? "Listening (Click to Stop)" : "Voice Control"}
          </button>
        </div>

        {/* Status Alerts */}
        {blocked && (
          <div role="alert" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" /> Browser Audio Blocked
            </p>
            <p>Your browser requires user interaction before playing sound.</p>
            <button
              onClick={() => question && announce(questionScript(question, index))}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors"
            >
              Play Question Audio
            </button>
          </div>
        )}

        {voiceError && (
          <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold">
            {voiceError}
          </div>
        )}

        {listening && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-center font-semibold">
            {lastHeard ? (
              <span>Heard: <strong className="text-emerald-950">&ldquo;{lastHeard}&rdquo;</strong></span>
            ) : (
              <span>Listening for your answer (e.g. &ldquo;Option A&rdquo;)...</span>
            )}
          </div>
        )}

        {/* Main Question Card */}
        <section aria-labelledby="question-heading" className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              Subject: {question?.subject.toUpperCase()}
            </span>
            <div className="flex items-center justify-center gap-3">
              <h1 id="question-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                {question?.question}
              </h1>
              <button
                onClick={() => question && announce(questionScript(question, index))}
                className="p-2 rounded-full text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors shrink-0"
                title="Click to re-listen"
                aria-label="Click to re-listen"
              >
                <Volume2 className="w-6 h-6 text-sky-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question?.options.map((option, i) => {
              const isSelected = selectedIdx === i;
              const isCorrect = option === question.answer;
              let btnClass =
                "bg-[#FAF9F5] hover:bg-slate-100 border border-slate-200 text-slate-800 text-base py-4 text-left px-6 rounded-2xl transition-all font-bold relative flex items-center justify-between";

              if (answered && isSelected) {
                if (isCorrect) {
                  btnClass =
                    "bg-emerald-50 border-2 border-emerald-500 text-emerald-900 text-base py-4 text-left px-6 rounded-2xl font-bold relative flex items-center justify-between";
                } else {
                  btnClass =
                    "bg-rose-50 border-2 border-rose-400 text-rose-900 text-base py-4 text-left px-6 rounded-2xl font-bold relative flex items-center justify-between";
                }
              }

              return (
                <button
                  key={option}
                  onClick={() => answerWith(i)}
                  disabled={answered}
                  className={btnClass}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white text-center leading-8 text-xs font-bold border border-slate-200 text-slate-700 shrink-0">
                      {LETTERS[i]}
                    </span>
                    <span>{option}</span>
                  </div>
                  {answered && isSelected && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AudioQuizPage;
