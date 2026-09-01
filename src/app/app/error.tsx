"use client";

import { CircleAlert } from "lucide-react";

export default function CitizenError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="ao-route-loading" role="alert"><CircleAlert /><strong>Your workspace could not be opened.</strong><span>Your information was not changed. Try loading this page again.</span><button className="ao-button ao-button--primary" type="button" onClick={reset}>Try again</button></div>;
}
