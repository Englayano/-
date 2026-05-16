export function splitNote(raw: string) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const title = lines[0]?.trim() || "ملاحظة جديدة";
  const content = lines.slice(1).join("\n").trim();
  return { title, content };
}

export function joinNote(title: string, content: string) {
  return [title, content].filter(Boolean).join("\n");
}

export function excerpt(content: string, length = 38) {
  const compact = content.replace(/\s+/g, " ").trim();
  return compact.length > length ? `${compact.slice(0, length)}…` : compact || "لا يوجد محتوى بعد";
}
