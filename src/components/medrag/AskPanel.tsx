import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { askMedRag } from "@/lib/rag.functions";
import { search, label, type Chunk, type Hit } from "@/lib/corpus";

const EXAMPLES = [
  "What causes abdominal tuberculosis?",
  "How does insulin regulate blood glucose?",
  "Management of atrial fibrillation",
  "Mechanism of beta-blockers",
];

export function AskPanel({ chunks, onSelect }: { chunks: Chunk[]; onSelect: (c: Chunk) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [asked, setAsked] = useState("");
  const ask = useServerFn(askMedRag);

  const answer = useMutation({
    mutationFn: (vars: { question: string; hits: Hit[] }) =>
      ask({
        data: {
          question: vars.question,
          contexts: vars.hits.slice(0, 6).map((h) => ({
            id: h.chunk.id,
            source: label(h.chunk),
            text: h.chunk.t.slice(0, 3500),
          })),
        },
      }),
  });

  function run(question: string) {
    const found = search(chunks, question, 8);
    setQ(question);
    setAsked(question);
    setHits(found);
    answer.reset();
    if (found.length) answer.mutate({ question, hits: found });
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim().length > 2) run(q.trim());
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ask a medical question…"
              className="h-11 pl-9"
            />
          </div>
          <Button type="submit" size="lg" disabled={answer.isPending}>
            {answer.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Retrieve & answer
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => run(e)}
              className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:bg-accent/20"
            >
              {e}
            </button>
          ))}
        </div>
      </Card>

      {asked && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Answer</h2>
            {answer.isPending && (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Reading {hits.length} retrieved passages…
              </p>
            )}
            {answer.isError && (
              <p className="mt-3 text-sm text-destructive">{(answer.error as Error).message}</p>
            )}
            {!hits.length && <p className="mt-3 text-sm text-muted-foreground">No passage matched that query.</p>}
            {answer.data && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {answer.data.answer}
              </p>
            )}
            <p className="mt-5 border-t border-border pt-3 text-xs text-muted-foreground">
              Educational demo over a 2,000-chunk MedRAG sample. Not medical advice.
            </p>
          </Card>

          <div className="space-y-3 lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Retrieved passages
            </h2>
            {hits.map((h, i) => (
              <Card
                key={h.chunk.id}
                onClick={() => onSelect(h.chunk)}
                className="cursor-pointer p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">S{i + 1}</Badge>
                  <span className="truncate text-xs text-muted-foreground">{label(h.chunk)}</span>
                  <Badge variant="outline">{h.score.toFixed(1)}</Badge>
                </div>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{h.chunk.t}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
