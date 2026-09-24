// SOLIXEmpower wordmark: the Solix red mark + "Empower" set in Outfit.
export default function Brand({ className = "", compact = false }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#EE2424" />
        <path d="M9 21.5c1.4 1.3 3.5 2 5.8 2 3.6 0 6-1.7 6-4.4 0-2.4-1.7-3.5-5-4.2l-1.6-.3c-1.7-.4-2.4-.9-2.4-1.8 0-1 1-1.7 2.6-1.7 1.6 0 2.9.6 3.8 1.5l1.9-2.3c-1.3-1.3-3.3-2-5.6-2-3.4 0-5.8 1.8-5.8 4.5 0 2.3 1.5 3.5 4.7 4.1l1.6.3c1.9.4 2.6.9 2.6 1.9 0 1.1-1.1 1.8-2.9 1.8-1.8 0-3.4-.7-4.4-1.8L9 21.5Z" fill="#fff" />
      </svg>
      <span className="font-display text-[19px] font-semibold leading-none tracking-tight">
        <span className="font-bold">SOLIX</span>
        <span className="text-primary">Empower</span>
        {!compact && <span className="ml-1.5 hidden align-top font-mono sm:inline text-[10px] font-medium tracking-widest text-current opacity-60">2026</span>}
      </span>
    </span>
  );
}
