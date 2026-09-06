"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { useStepUp } from "@/components/vault/step-up-dialog";
export function DeclarationForm(){
  const router=useRouter();const {stepUp,dialog}=useStepUp("en","Confirm this declaration with your OTP or passkey.");
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  return <form className="card grid max-w-2xl gap-5 p-6" onSubmit={async event=>{
    event.preventDefault();const fields=new FormData(event.currentTarget);setBusy(true);setError("");
    const input={title:fields.get("title"),declaration:fields.get("declaration"),confirm:fields.get("confirm")==="on"};
    const send=()=>fetch("/api/v1/declarations",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(input)});
    try {let response=await send();if(response.status===403){if(!await stepUp()){setBusy(false);return;}response=await send();}const result=await response.json();if(!response.ok)throw new Error(result.error?.message??"Could not create receipt");router.push(`/app/documents/${result.data.documentId}`);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }}>{dialog}<label className="grid gap-2 text-sm font-semibold">Title<input name="title" required minLength={3} maxLength={100} className="rounded-md border border-line bg-surface p-3 font-normal" placeholder="Application declaration"/></label><label className="grid gap-2 text-sm font-semibold">Your declaration<textarea name="declaration" required minLength={20} maxLength={2000} rows={7} className="rounded-md border border-line bg-surface p-3 font-normal" placeholder="I confirm that I have reviewed the information in my application…"/></label><label className="flex items-start gap-3 text-sm"><input name="confirm" type="checkbox" required className="mt-1 size-4"/>I confirm this statement and understand this sandbox receipt is not a licensed digital signature.</label>{error&&<p role="alert" className="text-sm text-danger-500">{error}</p>}<Button type="submit" className="cta justify-self-start" isPending={busy}>Confirm and create receipt</Button><p className="text-xs text-ink-3">Your receipt contains the full declaration, confirmation time and SHA-256 hash. It appears in Documents and your audit trail.</p></form>;
}
