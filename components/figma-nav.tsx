"use client";

import { CheckSquare, Home, NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";

export function FigmaNav({ active }: { active: "home" | "tasks" | "notes" }) {
  const router = useRouter();
  return (
    <>
      <div className="bottom-nav" />
      <Home className={`nav-icon home ${active === "home" ? "active-glow" : ""}`} size={32} />
      <CheckSquare className={`nav-icon tasks ${active === "tasks" ? "active-glow" : ""}`} size={32} />
      <NotebookPen className={`nav-icon notes ${active === "notes" ? "active-glow" : ""}`} size={38} />
      <button className="nav-hit home" aria-label="الرئيسية" onClick={() => router.push("/")} />
      <button className="nav-hit tasks" aria-label="المهام" onClick={() => router.push("/tasks")} />
      <button className="nav-hit notes" aria-label="الملاحظات" onClick={() => router.push("/notes")} />
    </>
  );
}

export function Brand({ home = false }: { home?: boolean }) {
  return (
    <>
      <div className={`brand-card ${home ? "tall" : ""}`} />
      <span className={`brand-text ${home ? "home" : ""}`}>مذكــرة</span>
    </>
  );
}
