"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "~/lib/utils";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/tips?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      inputRef.current?.blur();
    }
  };

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="hidden md:block">
      <div
        className={cn(
          "relative flex items-center rounded-xl border bg-muted/40 transition-all duration-200",
          isFocused
            ? "w-80 border-amber-300 ring-2 ring-amber-500/20 bg-background"
            : "w-64 lg:w-72 border-transparent hover:border-border hover:bg-muted/60",
        )}
      >
        <Search className="pointer-events-none ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          placeholder="팁 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="h-9 w-full bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="pointer-events-none mr-2 hidden shrink-0 select-none rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 lg:inline-block">
            ⌘K
          </kbd>
        )}
      </div>
    </form>
  );
}
