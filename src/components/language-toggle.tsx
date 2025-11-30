"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLanguage } from "@/lib/actions";
import type { SupportedLanguage } from "@/lib/i18n";

type LanguageToggleProps = {
  currentLanguage: SupportedLanguage;
  labels: {
    english: string;
    pashto: string;
  };
};

export function LanguageToggle({
  currentLanguage,
  labels,
}: LanguageToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (lang: SupportedLanguage) => {
    if (lang === currentLanguage) {
      return;
    }
    startTransition(async () => {
      await setLanguage(lang);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-input bg-card p-1 text-xs font-medium">
      <button
        type="button"
        onClick={() => handleChange("en")}
        className={`rounded-md px-2 py-1 transition ${
          currentLanguage === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        disabled={isPending}
      >
        {labels.english}
      </button>
      <button
        type="button"
        onClick={() => handleChange("ps")}
        className={`rounded-md px-2 py-1 transition ${
          currentLanguage === "ps"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        disabled={isPending}
      >
        {labels.pashto}
      </button>
    </div>
  );
}


