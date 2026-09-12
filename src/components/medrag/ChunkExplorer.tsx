import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { label, type Chunk } from "@/lib/corpus";

type Filter = "all" | "textbook" | "statpearls";

export function ChunkExplorer({ chunks, onSelect }: { chunks: Chunk[]; onSelect: (c: Chunk) => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(30);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return chunks.filter(
      (c) =>
        (filter === "all" || c.st === filter) &&
        (!needle || c.t.toLowerCase().includes(needle) || c.id.toLowerCase().includes(needle)),
    );
  }, [chunks, q, filter]);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(30);
          }}
          placeholder="Filter by text or chunk id…"
          className="sm:max-w-sm"
        />
        <div className="flex gap-2">
          {(["all", "textbook", "statpearls"] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => {
                setFilter(f);
                setLimit(30);
              }}
            >
              {f}
            </Button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground sm:ml-auto">{rows.length} chunks</span>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {rows.slice(0, limit).map((c) => (
          <li key={c.i}>
            <button
              onClick={() => onSelect(c)}
              className="w-full py-3 text-left transition-colors hover:bg-muted/60"
            >
              <div className="flex items-center gap-2">
                <Badge variant={c.st === "textbook" ? "default" : "secondary"}>{c.st}</Badge>
                <span className="truncate text-sm font-medium text-foreground">{label(c)}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{c.tk} tok</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{c.t}</p>
            </button>
          </li>
        ))}
      </ul>

      {rows.length > limit && (
        <Button variant="outline" className="mt-4 w-full" onClick={() => setLimit((l) => l + 30)}>
          Load more
        </Button>
      )}
    </Card>
  );
}
