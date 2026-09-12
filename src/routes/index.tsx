import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { AskPanel } from "@/components/medrag/AskPanel";
import { EmbeddingMap } from "@/components/medrag/EmbeddingMap";
import { CorpusStats } from "@/components/medrag/CorpusStats";
import { ChunkExplorer } from "@/components/medrag/ChunkExplorer";
import { loadCorpus, type Chunk } from "@/lib/corpus";

const TITLE = "MedRAG Explorer — interactive medical retrieval dashboard";
const DESC =
  "Ask questions, inspect retrieved passages, and explore the embedding map of a 2,000-chunk MedRAG sample from StatPearls and 18 medical textbooks.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [selected, setSelected] = useState<Chunk | null>(null);
  const [tab, setTab] = useState("ask");
  const { data: chunks, isLoading, error } = useQuery({ queryKey: ["corpus"], queryFn: loadCorpus });

  function inspect(c: Chunk) {
    setSelected(c);
    setTab("map");
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-6">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">MedRAG mini</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Retrieval dashboard</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            2,000 sampled chunks — 1,000 StatPearls articles and 1,000 passages from 18 textbooks — with their
            MedCPT embedding geometry.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {isLoading && (
          <Card className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading the corpus…
          </Card>
        )}
        {error && <Card className="p-8 text-sm text-destructive">The corpus could not be loaded.</Card>}

        {chunks && (
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="ask">Ask</TabsTrigger>
              <TabsTrigger value="map">Embedding map</TabsTrigger>
              <TabsTrigger value="browse">Browse chunks</TabsTrigger>
              <TabsTrigger value="stats">Corpus stats</TabsTrigger>
            </TabsList>

            <TabsContent value="ask">
              <AskPanel chunks={chunks} onSelect={inspect} />
            </TabsContent>
            <TabsContent value="map">
              <EmbeddingMap chunks={chunks} selected={selected} onSelect={setSelected} />
            </TabsContent>
            <TabsContent value="browse">
              <ChunkExplorer chunks={chunks} onSelect={inspect} />
            </TabsContent>
            <TabsContent value="stats">
              <CorpusStats chunks={chunks} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
