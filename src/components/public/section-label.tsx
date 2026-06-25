interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E1E1E]">
      <span className="w-1.5 h-1.5 bg-[#1E1E1E]" />
      {children}
    </div>
  );
}
