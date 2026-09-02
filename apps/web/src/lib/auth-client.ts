"use client";
import { createAuthClient } from "better-auth/react";
import { phoneNumberClient, inferAdditionalFields } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import type { Auth } from "./auth";

export const authClient = createAuthClient({ plugins: [phoneNumberClient(), passkeyClient(), inferAdditionalFields<Auth>()] });
export const { useSession, signOut } = authClient;
