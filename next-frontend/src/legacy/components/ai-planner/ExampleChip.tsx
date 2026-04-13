interface ExampleChipProps {
  label: string;
  onClick: (value: string) => void;
}

export function ExampleChip({ label, onClick }: ExampleChipProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(label)}
      className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
    >
      {label}
    </button>
  );
}
