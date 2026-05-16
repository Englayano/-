"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CheckSquare, Home, NotebookPen, Plus, Search, Settings } from "lucide-react";
import { useEffect } from "react";
import { api } from "@/lib/api";
import type { ShortcutAction } from "@/types/electron";

const nav = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/tasks", label: "المهام", icon: CheckSquare },
  { href: "/notes", label: "الملاحظات", icon: NotebookPen },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    api.checkNotifications();
    const timer = window.setInterval(() => api.checkNotifications(), 1000 * 60 * 60);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!window.mudhakkirah) return undefined;
    return window.mudhakkirah.shortcuts.on((action: ShortcutAction) => {
      window.dispatchEvent(new CustomEvent("app-shortcut", { detail: action }));
      if (action === "new-task") router.push("/tasks?new=1");
      if (action === "new-note") router.push("/notes?new=1");
    });
  }, [router]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-5 p-5">
      <aside className="sticky top-5 flex h-[calc(100vh-40px)] w-56 shrink-0 flex-col justify-between rounded-lg border border-line bg-card/90 p-3 shadow-soft backdrop-blur">
        <div>
          <div className="mb-8 px-3 pt-3">
            <p className="text-sm text-ink/55">تطبيق سطح المكتب</p>
            <h1 className="text-4xl font-bold leading-tight">مذكرة</h1>
          </div>
          <nav className="space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`focus-ring flex items-center gap-3 rounded-md px-3 py-3 text-base transition ${
                    active ? "bg-ink text-paper" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="rounded-md bg-paper p-3 text-sm text-ink/60">
          <div className="mb-2 flex items-center gap-2 text-ink">
            <Bell size={17} />
            <span>تنبيهات محلية مفعّلة</span>
          </div>
          <p>Ctrl+N للمهام، Ctrl+Shift+N للملاحظات، Ctrl+F للبحث.</p>
        </div>
      </aside>
      <main className="min-w-0 flex-1 pb-5">
        <div className="mb-5 flex items-center justify-end gap-2">
          <button
            className="focus-ring grid h-11 w-11 place-items-center rounded-md border border-line bg-card text-ink shadow-sm hover:bg-paper"
            title="بحث"
            onClick={() => window.dispatchEvent(new CustomEvent("app-shortcut", { detail: "search" }))}
          >
            <Search size={19} />
          </button>
          <button
            className="focus-ring grid h-11 w-11 place-items-center rounded-md bg-ink text-paper shadow-sm hover:bg-ink/90"
            title="إنشاء مهمة"
            onClick={() => router.push("/tasks?new=1")}
          >
            <Plus size={20} />
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
