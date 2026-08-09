"use client";

const prefixEmojis = ["🦑", "🦐", "🐚", "🐟", "🦀"];

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  categories?: string[];
  onSelectCategory?: (category: string) => void;
}

export default function TextEditor({ value, onChange, placeholder, categories = [], onSelectCategory }: TextEditorProps) {
  const availablePrefixes = prefixEmojis.filter((emoji) => categories.includes(emoji));
  const addPrefix = (emoji: string) => {
    if (!categories.includes(emoji)) return;
    onChange(value ? `${emoji} ${value}` : emoji);
    if (categories.includes(emoji)) onSelectCategory?.(emoji);
  };
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--input)] focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] p-2">
        {availablePrefixes.length > 0 && <>
          <span className="px-1 text-[10px] font-semibold text-[var(--muted-foreground)]">Add front</span>
          {availablePrefixes.map((emoji) => <button type="button" key={emoji} onClick={() => addPrefix(emoji)} className="h-8 w-8 rounded-[var(--radius-md)] text-lg hover:bg-[var(--muted)]" aria-label={`Add ${emoji}`}>{emoji}</button>)}
        </>}
      </div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full min-h-[180px] resize-y border-0 bg-transparent p-4 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]" />
    </div>
  );
}
