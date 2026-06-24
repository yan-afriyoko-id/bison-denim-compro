interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black">
      <span className="w-1.5 h-1.5 bg-black" />
      {children}
    </div>
  );
}
