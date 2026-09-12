import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { label, type Chunk } from "@/lib/corpus";

export function EmbeddingMap({
  chunks,
  selected,
  onSelect,
}: {
  chunks: Chunk[];
  selected: Chunk | null;
  onSelect: (c: Chunk) => void;
}) {
  const [hover, setHover] = useState<Chunk | null>(null);
  const neighbours = useMemo(
    () => (selected ? selected.nb.map(([i, s]) => ({ chunk: chunks[i], sim: s })) : []),
    [selected, chunks],
  );
  const nbSet = useMemo(() => new Set(neighbours.map((n) => n.chunk.i)), [neighbours]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="p-4 lg:col-span-3">
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" /> Textbooks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-accent" /> StatPearls
          </span>
          <span className="ml-auto">Click a point to inspect it</span>
        </div>
        <svg viewBox="0 0 100 100" className="aspect-square w-full rounded-md bg-muted/50">
          {chunks.map((c) => {
            const isSel = selected?.i === c.i;
            const isNb = nbSet.has(c.i);
            return (
              <circle
                key={c.i}
                cx={c.x * 96 + 2}
                cy={(1 - c.y) * 96 + 2}
                r={isSel ? 1.4 : isNb ? 1.1 : 0.5}
                className={
                  isSel
                    ? "fill-destructive"
                    : isNb
                      ? "fill-chart-3"
                      : c.st === "textbook"
                        ? "fill-primary"
                        : "fill-accent"
                }
                opacity={selected && !isSel && !isNb ? 0.28 : 0.8}
                onMouseEnter={() => setHover(c)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(c)}
                style={{ cursor: "pointer" }}
              />
            );
          })}
        </svg>
        <p className="mt-3 text-xs text-muted-foreground">
          {hover ? label(hover) : "2,000 chunks projected from their MedCPT vectors (mean-centred, 2 components)."}
        </p>
      </Card>

      <Card className="p-5 lg:col-span-2">
        {selected ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{selected.st}</Badge>
              <span className="text-xs text-muted-foreground">{selected.id}</span>
            </div>
            <h3 className="mt-2 text-base font-semibold text-foreground">{label(selected)}</h3>
            <p className="mt-3 max-h-56 overflow-y-auto text-xs leading-relaxed text-muted-foreground">
              {selected.t}
            </p>
            <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nearest neighbours
            </h4>
            <ul className="mt-2 space-y-2">
              {neighbours.map((n) => (
                <li key={n.chunk.i}>
                  <button
                    onClick={() => onSelect(n.chunk)}
                    className="w-full rounded-md border border-border p-2 text-left transition-colors hover:border-primary"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium">{label(n.chunk)}</span>
                      <Badge variant="outline">{n.sim.toFixed(2)}</Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a point on the map to see its text and neighbours.</p>
        )}
      </Card>
    </div>
  );
}
