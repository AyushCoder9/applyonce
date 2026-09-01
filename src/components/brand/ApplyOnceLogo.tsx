import Link from "next/link";

type ApplyOnceLogoProps = {
  href?: string;
  showName?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  tone?: "ink" | "light";
  className?: string;
};

export function ApplyOnceLogo({
  href = "/",
  showName = true,
  size = "md",
  tone = "ink",
  className = "",
}: ApplyOnceLogoProps) {
  const content = (
    <span className={`ao-brand ao-brand--${size} ao-brand--${tone} ${className}`.trim()}>
      <span className="ao-brand-mark" aria-hidden={showName ? true : undefined} role={showName ? undefined : "img"} aria-label={showName ? undefined : "ApplyOnce"}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <path d="M9 8.5h18a5 5 0 0 1 5 5v21a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-21a5 5 0 0 1 5-5Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="2.75" />
          <path d="m10.5 24 4.1 4.1 8-9" stroke="currentColor" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 24h5.5M37.5 24V13.5M37.5 24v10.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="39.5" cy="11.5" r="3.5" fill="var(--ao-logo-accent, #CFF7E9)" stroke="currentColor" strokeWidth="2.3" />
          <circle cx="39.5" cy="36.5" r="3.5" fill="var(--ao-logo-accent, #CFF7E9)" stroke="currentColor" strokeWidth="2.3" />
        </svg>
      </span>
      {showName ? <span className="ao-brand-name">ApplyOnce</span> : null}
    </span>
  );

  return href ? <Link href={href} aria-label="ApplyOnce home">{content}</Link> : content;
}

export function ApplyOnceMark({
  size = "md",
  tone = "ink",
  className = "",
}: Omit<ApplyOnceLogoProps, "href" | "showName">) {
  return <ApplyOnceLogo href="" showName={false} size={size} tone={tone} className={className} />;
}
