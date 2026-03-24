"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "~/components/ui/input";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/tips?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="hidden md:block">
      <Input
        type="search"
        placeholder="팁 검색..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 w-48 lg:w-64"
      />
    </form>
  );
}
