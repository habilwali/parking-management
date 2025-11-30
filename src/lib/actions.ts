"use server";

import { cookies } from "next/headers";
import type { SupportedLanguage } from "@/lib/i18n";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLanguage(lang: SupportedLanguage) {
  const cookieStore = await cookies();
  cookieStore.set("lang", lang, {
    httpOnly: false,
    path: "/",
    maxAge: ONE_YEAR,
  });
}


