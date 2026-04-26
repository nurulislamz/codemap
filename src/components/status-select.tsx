type LearningStatus = "not_started" | "learning" | "reviewed" | "mastered";

type StatusSelectProps = {
  ariaLabel: string;
  defaultValue: LearningStatus;
  disabled?: boolean;
  name: string;
};

const statusOptions: Array<{ value: LearningStatus; label: string }> = [
  { value: "not_started", label: "Not started" },
  { value: "learning", label: "Learning" },
  { value: "reviewed", label: "Reviewed" },
  { value: "mastered", label: "Mastered" },
];

export function StatusSelect({
  ariaLabel,
  defaultValue,
  disabled = false,
  name,
}: StatusSelectProps) {
  return (
    <select
      aria-label={ariaLabel}
      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      defaultValue={defaultValue}
      disabled={disabled}
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
