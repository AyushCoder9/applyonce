export type SourceProvider = "digilocker" | "meripehchaan" | "apaar" | "profile";

const sourceNames: Record<SourceProvider, string> = {
  digilocker: "DigiLocker",
  meripehchaan: "MeriPehchaan",
  apaar: "APAAR",
  profile: "Your profile",
};

type SourceMarkProps = {
  provider: SourceProvider;
  size?: "sm" | "md";
  className?: string;
};

/**
 * A small, consistent connection mark for the source cards.
 * These are ApplyOnce connection marks, not official provider trademarks.
 */
export function SourceMark({ provider, size = "md", className = "" }: SourceMarkProps) {
  const label = `${sourceNames[provider]} connection mark`;

  return (
    <span className={`ao-source-mark ao-source-mark--${provider} ao-source-mark--${size} ${className}`.trim()} role="img" aria-label={label}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <title>{label}</title>
        {provider === "digilocker" ? (
          <>
            <rect x="7.5" y="5.5" width="17" height="21" rx="4" stroke="currentColor" strokeWidth="2.2" />
            <path d="M12 11h8M12 15h8M12 20.5l2.6 2.4 5.3-5.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : provider === "meripehchaan" ? (
          <>
            <path d="M7 23V9l6.5 7L20 9v14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7" cy="9" r="2" fill="currentColor" />
            <circle cx="20" cy="9" r="2" fill="currentColor" />
            <circle cx="26" cy="23" r="2" fill="currentColor" />
            <path d="M20 9h4a2 2 0 0 1 2 2v10" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
          </>
        ) : provider === "apaar" ? (
          <>
            <path d="m7 25 7.2-18h3.6L25 25M10 18h14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24.5" cy="8" r="2.5" fill="currentColor" />
          </>
        ) : (
          <>
            <circle cx="16" cy="11" r="4" stroke="currentColor" strokeWidth="2.2" />
            <path d="M7.5 25c1.3-4.6 4.1-7 8.5-7s7.2 2.4 8.5 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M25 8.5h3M26.5 7v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  );
}
