"use client";
import Link from "next/link";
export default function ErrorPage({reset}:{error:Error;reset:()=>void}) {return <main className="mx-auto grid max-w-xl gap-4 p-8"><h1 className="font-display text-3xl font-bold">We could not load this page.</h1><p className="text-ink-2">Your saved work is still there. Retry, or return home to continue.</p><div className="flex gap-4"><button className="cta px-5 py-2" onClick={reset}>Try again</button><Link className="p-2 underline" href="/app">Go to home</Link></div></main>;}
