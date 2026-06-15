import { PomodoroTimerClient } from "@/components/pomodoro/pomodoro-timer-client";
import { savePomodoroSession } from "@/lib/pomodoro/actions";
import { savePomodoroTasks } from "@/lib/pomodoro/task-actions";
import { Icon, SectionHero } from "@/components/shared";

export const metadata = {
  title: "Pomodoro",
};

export default function PomodoroPage() {
  return (
    <div className="space-y-5 pb-4">
      <SectionHero
        icon={<Icon name="calendar" className="h-9 w-9" />}
        title="Pomodoro"
        description="Run timed focus sessions and keep a record of how long you worked."
      />

      <PomodoroTimerClient
        saveSessionAction={savePomodoroSession}
        saveTasksAction={savePomodoroTasks}
      />
    </div>
  );
}
