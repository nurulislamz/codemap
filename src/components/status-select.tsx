type LearningStatus = "not_started" | "learning" | "reviewed" | "mastered";

type StatusSelectProps = {
  name: string;
  defaultValue: LearningStatus;
};

const statusOptions: Array<{ value: LearningStatus; label: string }> = [
  { value: "not_started", label: "Not started" },
  { value: "learning", label: "Learning" },
  { value: "reviewed", label: "Reviewed" },
  { value: "mastered", label: "Mastered" },
];

export function StatusSelect({ name, defaultValue }: StatusSelectProps) {
  return (
    <select
      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
      defaultValue={defaultValue}
      name={name}
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
