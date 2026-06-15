"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { AppPanel, Icon, StatCard } from "@/components/shared";
import { FocusTimePanel } from "@/components/pomodoro/focus-time-panel";
import { formatRemainingTime, useCountdown } from "@/components/ui/timer-panel";
import type { PomodoroSession } from "@/lib/firebase/pomodoro";
import type { PomodoroTask } from "@/lib/firebase/tasks";
import type { SavePomodoroSessionInput } from "@/lib/pomodoro/actions";
import type { SavePomodoroTasksInput } from "@/lib/pomodoro/task-actions";
import {
  getLocalPomodoroSessions,
  saveLocalPomodoroSession,
} from "@/lib/pomodoro/local-session-storage";
import {
  getLocalPomodoroTasks,
  saveLocalPomodoroTasks,
} from "@/lib/pomodoro/local-task-storage";
import { formatSecondsDuration } from "@/lib/leetcode/leetcode-formatters";

type PomodoroTimerClientProps = {
  saveSessionAction: (input: SavePomodoroSessionInput) => Promise<void>;
  saveTasksAction: (input: SavePomodoroTasksInput) => Promise<void>;
};

type SessionsResponse = {
  sessions?: PomodoroSession[];
};

type TasksResponse = {
  tasks?: PomodoroTask[];
};

// Persisting to localStorage can throw when storage is disabled; degrade
// gracefully rather than crashing a click handler.
function saveLocalTasksSafely(tasks: PomodoroTask[]) {
  try {
    saveLocalPomodoroTasks(tasks);
  } catch (error) {
    console.warn("Could not persist tasks locally", error);
  }
}

type PomodoroMode = {
  id: "pomodoro" | "short" | "long";
  label: string;
  minutes: number;
  // Only focus sessions are persisted; breaks just run a timer.
  persist: boolean;
  prompt: string;
};

const MODES: readonly PomodoroMode[] = [
  { id: "pomodoro", label: "Pomodoro", minutes: 25, persist: true, prompt: "Time to focus!" },
  { id: "short", label: "Short Break", minutes: 5, persist: false, prompt: "Time for a short break!" },
  { id: "long", label: "Long Break", minutes: 15, persist: false, prompt: "Time for a long break!" },
];

export function PomodoroTimerClient({
  saveSessionAction,
  saveTasksAction,
}: PomodoroTimerClientProps) {
  const { status: authStatus, user, getIdToken } = useAuth();
  const [modeId, setModeId] = useState<PomodoroMode["id"]>("pomodoro");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [tasks, setTasks] = useState<PomodoroTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const shouldSaveLocally = authStatus !== "signed-in";

  const mode = useMemo(
    () => MODES.find((option) => option.id === modeId) ?? MODES[0],
    [modeId],
  );
  const isRunning = startedAt !== null;

  const loadSessions = useCallback(
    async (signal?: AbortSignal) => {
      if (authStatus !== "signed-in" || !user) {
        setSessions(getLocalPomodoroSessions().slice(0, 20));
        return;
      }

      try {
        const idToken = await getIdToken();
        const response = await fetch("/api/pomodoro/sessions", {
          cache: "no-store",
          headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
          signal,
        });

        if (!response.ok) {
          console.warn(`Pomodoro sessions request failed: ${response.status}`);
          return;
        }

        const data = (await response.json()) as SessionsResponse;
        setSessions(data.sessions ?? []);
      } catch (error) {
        if (!signal?.aborted) {
          console.warn("Pomodoro sessions request failed", error);
        }
      }
    },
    [authStatus, getIdToken, user],
  );

  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }

    const controller = new AbortController();
    // Defer off the synchronous effect body to avoid a cascading render.
    const timeoutId = window.setTimeout(() => void loadSessions(controller.signal), 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [authStatus, loadSessions]);

  const loadTasks = useCallback(
    async (signal?: AbortSignal) => {
      if (authStatus !== "signed-in" || !user) {
        setTasks(getLocalPomodoroTasks());
        return;
      }

      try {
        const idToken = await getIdToken();
        const response = await fetch("/api/pomodoro/tasks", {
          cache: "no-store",
          headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
          signal,
        });

        if (!response.ok) {
          console.warn(`Pomodoro tasks request failed: ${response.status}`);
          return;
        }

        const data = (await response.json()) as TasksResponse;
        setTasks(data.tasks ?? []);
      } catch (error) {
        if (!signal?.aborted) {
          console.warn("Pomodoro tasks request failed", error);
        }
      }
    },
    [authStatus, getIdToken, user],
  );

  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }

    const controller = new AbortController();
    // Defer off the synchronous effect body to avoid a cascading render.
    const timeoutId = window.setTimeout(() => void loadTasks(controller.signal), 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [authStatus, loadTasks]);

  // Optimistically update the UI, then persist: to the user's Firestore tasks
  // when signed in, otherwise to localStorage.
  const persistTasks = useCallback(
    (next: PomodoroTask[]) => {
      setTasks(next);

      if (shouldSaveLocally) {
        saveLocalTasksSafely(next);
        return;
      }

      void (async () => {
        try {
          const idToken = await getIdToken();

          if (!idToken) {
            saveLocalTasksSafely(next);
            return;
          }

          await saveTasksAction({ tasks: next, idToken });
        } catch (error) {
          console.error("Failed to save pomodoro tasks", error);
        }
      })();
    },
    [getIdToken, saveTasksAction, shouldSaveLocally],
  );

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = newTask.trim();
    if (!text) return;

    persistTasks([
      ...tasks,
      { id: crypto.randomUUID(), text, done: false, createdAt: new Date().toISOString() },
    ]);
    setNewTask("");
  }

  function toggleTask(id: string) {
    persistTasks(
      tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  }

  function removeTask(id: string) {
    persistTasks(tasks.filter((task) => task.id !== id));
  }

  function selectMode(nextModeId: PomodoroMode["id"]) {
    if (isRunning) return;
    setMessage(null);
    setModeId(nextModeId);
  }

  function startSession() {
    setMessage(null);
    setStartedAt(new Date().toISOString());
  }

  const finishSession = useCallback(
    (completed: boolean) => {
      if (!startedAt) return;

      const sessionStart = startedAt;
      const endedAt = new Date().toISOString();
      const finishedMode = mode;
      setStartedAt(null);

      if (completed) {
        playCompletionChime();
      }

      // Breaks are not persisted — just reset and acknowledge.
      if (!finishedMode.persist) {
        setMessage(completed ? "Break over. Back to it!" : "Break ended.");
        return;
      }

      startTransition(async () => {
        const durationSeconds = Math.max(
          1,
          Math.floor(
            (new Date(endedAt).getTime() - new Date(sessionStart).getTime()) / 1000,
          ),
        );

        if (shouldSaveLocally) {
          saveLocalPomodoroSession({
            sessionId: crypto.randomUUID(),
            startedAt: sessionStart,
            endedAt,
            durationSeconds,
            targetMinutes: finishedMode.minutes,
            completed,
          });
          setSessions(getLocalPomodoroSessions().slice(0, 20));
          setMessage("Saved locally.");
          return;
        }

        try {
          const idToken = await getIdToken();

          if (!idToken) {
            setMessage("Sign in again before saving.");
            return;
          }

          await saveSessionAction({
            startedAt: sessionStart,
            endedAt,
            targetMinutes: finishedMode.minutes,
            completed,
            idToken,
          });
          setMessage(completed ? "Session complete. Saved." : "Stopped early. Saved.");
          await loadSessions();
        } catch (saveError) {
          console.error("Failed to save pomodoro session", saveError);
          setMessage("Session could not be saved. Try again.");
        }
      });
    },
    [getIdToken, loadSessions, mode, saveSessionAction, shouldSaveLocally, startedAt],
  );

  const todaySessions = sessions.filter((session) => isToday(session.startedAt));
  const todaySeconds = todaySessions.reduce(
    (total, session) => total + session.durationSeconds,
    0,
  );
  const roundNumber = todaySessions.length + 1;
  const openTaskCount = tasks.filter((task) => !task.done).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Focused today"
          value={formatSecondsDuration(todaySeconds)}
          note="Total focus time"
          tone="primary"
          icon={<Icon name="clock" className="h-7 w-7" />}
        />
        <StatCard
          label="Sessions"
          value={todaySessions.length}
          note="Completed today"
          tone="success"
          icon={<Icon name="flame" className="h-7 w-7" />}
        />
      </div>

      <AppPanel className="p-7 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {MODES.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={isRunning && option.id !== mode.id}
              aria-pressed={option.id === mode.id}
              className={`cursor-pointer rounded-xl border px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                option.id === mode.id
                  ? "border-[#7c68ff] bg-[#241d55] text-white"
                  : "border-[#26364d] bg-[#101a2a] text-slate-200 hover:border-[#516278]"
              }`}
              onClick={() => selectMode(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <PomodoroClock
          startedAt={startedAt}
          minutes={mode.minutes}
          onComplete={finishSession}
        />

        <div className="flex justify-center">
          <button
            type="button"
            disabled={isPending}
            aria-label={isRunning ? "Stop timer" : "Start timer"}
            className={`min-w-44 cursor-pointer rounded-xl px-8 py-3.5 text-base font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isRunning
                ? "border border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white"
                : "bg-[#6747ff] text-white hover:bg-[#775bff]"
            }`}
            onClick={isRunning ? () => finishSession(false) : startSession}
          >
            {isPending ? "Saving…" : isRunning ? "Stop" : "Start"}
          </button>
        </div>

        <div className="mt-6">
          <div className="text-sm font-bold text-slate-400">#{roundNumber}</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {message ?? mode.prompt}
          </div>
        </div>
      </AppPanel>

      <section className="grid gap-5 xl:grid-cols-2">
        <AppPanel className="p-7">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Tasks</h2>
            <span className="text-sm font-medium text-slate-300/72">
              {openTaskCount} open
            </span>
          </div>

          <form className="mt-5 flex gap-2" onSubmit={addTask}>
            <input
              type="text"
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
              placeholder="Add a task…"
              aria-label="New task"
              className="min-w-0 flex-1 rounded-lg border border-[#26364d] bg-[#101a2a] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#7c68ff] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newTask.trim()}
              className="cursor-pointer rounded-lg bg-[#6747ff] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#775bff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0b1320]/55 p-3"
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    aria-label={`Mark "${task.text}" as ${task.done ? "not done" : "done"}`}
                    className="h-4 w-4 cursor-pointer accent-[#6747ff]"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      task.done ? "text-slate-500 line-through" : "text-white"
                    }`}
                  >
                    {task.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    aria-label={`Delete "${task.text}"`}
                    className="cursor-pointer rounded-md px-2 py-1 text-xs font-bold text-slate-400 transition hover:text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4 text-sm text-slate-300/70">
                No tasks yet. Add one above.
              </div>
            )}
          </div>
        </AppPanel>

        <FocusTimePanel sessions={sessions} />
      </section>
    </div>
  );
}

type PomodoroClockProps = {
  startedAt: string | null;
  minutes: number;
  onComplete: (completed: boolean) => void;
};

function PomodoroClock({ startedAt, minutes, onComplete }: PomodoroClockProps) {
  if (startedAt) {
    return (
      <RunningClock startedAt={startedAt} minutes={minutes} onComplete={onComplete} />
    );
  }

  return <ClockFace seconds={minutes * 60} />;
}

function RunningClock({
  startedAt,
  minutes,
  onComplete,
}: {
  startedAt: string;
  minutes: number;
  onComplete: (completed: boolean) => void;
}) {
  const handleComplete = useCallback(() => onComplete(true), [onComplete]);
  const remainingSeconds = useCountdown(startedAt, minutes, handleComplete);

  return <ClockFace seconds={remainingSeconds} />;
}

function ClockFace({ seconds }: { seconds: number }) {
  return (
    <p
      aria-label="Time remaining"
      className="my-7 font-mono text-7xl font-bold tracking-tight text-[#a997ff] tabular-nums sm:text-8xl"
    >
      {formatRemainingTime(seconds)}
    </p>
  );
}

function isToday(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function playCompletionChime() {
  const AudioContextCtor = window.AudioContext;

  if (!AudioContextCtor) return;

  const audioContext = new AudioContextCtor();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.frequency.value = 880;
  gain.gain.value = 0.04;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.4);
}
