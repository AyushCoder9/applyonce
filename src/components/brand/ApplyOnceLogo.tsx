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
      <span className="ao-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <title>ApplyOnce</title>
          <desc>One verified citizen profile branching into many applications.</desc>
          <path d="M13 7.5h14.5A5.5 5.5 0 0 1 33 13v6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M13 7.5A5.5 5.5 0 0 0 7.5 13v22A5.5 5.5 0 0 0 13 40.5h21A6.5 6.5 0 0 0 40.5 34V19.5H24A5.5 5.5 0 0 1 18.5 14V7.5H13Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <path d="m17 28 4.5 4.5L31.5 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="37" cy="11" r="5" fill="var(--ao-logo-accent, #CFF7E9)" stroke="currentColor" strokeWidth="2.5" />
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
