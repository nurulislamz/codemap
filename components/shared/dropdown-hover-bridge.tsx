export function DropdownHoverBridge({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute left-0 top-full z-40 h-3 w-full ${className}`}
    />
  );
}
