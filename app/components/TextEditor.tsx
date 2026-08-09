"use client";

const prefixEmojis = ["🦑", "🦐", "🐚", "🐟", "🦀"];
const lineNumbers = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TextEditor({ value, onChange, placeholder }: TextEditorProps) {
  const addPrefix = (emoji: string) => onChange(value ? `${emoji} ${value}` : emoji);
  const removeNumberedLines = (emoji: string) => onChange(value.split("\n").filter((line) => !line.trimStart().startsWith(emoji)).join("\n"));

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--input)] focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] p-2">
        <span className="px-1 text-[10px] font-semibold text-[var(--muted-foreground)]">Add front</span>
        {prefixEmojis.map((emoji) => <button type="button" key={emoji} onClick={() => addPrefix(emoji)} className="h-8 w-8 rounded-[var(--radius-md)] text-lg hover:bg-[var(--muted)]" aria-label={`Add ${emoji}`}>{emoji}</button>)}
        <span className="ml-2 px-1 text-[10px] font-semibold text-[var(--muted-foreground)]">Delete lines</span>
        {lineNumbers.map((emoji) => <button type="button" key={emoji} onClick={() => removeNumberedLines(emoji)} className="h-8 w-8 rounded-[var(--radius-md)] text-sm hover:bg-[var(--danger)]/10" aria-label={`Delete lines numbered ${emoji}`}>{emoji}</button>)}
      </div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full min-h-[180px] resize-y border-0 bg-transparent p-4 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]" />
    </div>
  );
}
