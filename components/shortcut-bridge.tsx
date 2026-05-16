"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ShortcutAction } from "@/types/electron";

export function ShortcutBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!window.mudhakkirah) return undefined;
    return window.mudhakkirah.shortcuts.on((action: ShortcutAction) => {
      window.dispatchEvent(new CustomEvent("app-shortcut", { detail: action }));
      if (action === "new-task") router.push("/tasks?new=1");
      if (action === "new-note") router.push("/notes?new=1");
    });
  }, [router]);

  useEffect(() => {
    window.mudhakkirah?.notifications.checkDueTasks();
  }, []);

  return null;
}
