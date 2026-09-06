/** ponytail: one flat map from job name -> handler. No class hierarchy, no plugin system. */
import type { JobMap, JobName } from "@applyonce/jobs";
import { digilockerSync, panVerify, aaIncome, abhaLink } from "./verification";
import { documentProcess } from "./documents";
import { webhookDeliver } from "./webhooks";
import { notify } from "./notifications";
import { scanExpiries, scanMismatches, scanHandover18, scanDeadlines } from "./scheduled";
import { dataExport, dataErase } from "./data";

export const handlers: { [N in JobName]: (data: JobMap[N]) => Promise<unknown> } = {
  "digilocker.sync": digilockerSync,
  "pan.verify": panVerify,
  "aa.income": aaIncome,
  "abha.link": abhaLink,
  "document.process": documentProcess,
  "webhook.deliver": webhookDeliver,
  notify: notify,
  "scan.expiries": scanExpiries,
  "scan.mismatches": scanMismatches,
  "scan.handover18": scanHandover18,
  "scan.deadlines": scanDeadlines,
  "data.export": dataExport,
  "data.erase": dataErase,
};

export { registerSchedulers } from "./scheduled";
