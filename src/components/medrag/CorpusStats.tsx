import { useMemo } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { Chunk } from "@/lib/corpus";

export function CorpusStats({ chunks }: { chunks: Chunk[] }) {
  const { bySource, byDoc, byLength } = useMemo(() => {
    const src = new Map<string, number>();
    const doc = new Map<string, number>();
    const buckets = [0, 0, 0, 0, 0, 0];
    for (const c of chunks) {
      src.set(c.st, (src.get(c.st) ?? 0) + 1);
      if (c.st === "textbook") doc.set(c.d, (doc.get(c.d) ?? 0) + 1);
      const b = Math.min(5, Math.floor(c.tk / 100));
      buckets[b] += 1;
    }
    return {
      bySource: [...src].map(([name, value]) => ({ name, value })),
      byDoc: [...doc].map(([name, value]) => ({ name: name.replace(/_/g, " "), value })).sort((a, b) => b.value - a.value),
      byLength: buckets.map((value, i) => ({ name: i === 5 ? "500+" : `${i * 100}-${i * 100 + 99}`, value })),
    };
  }, [chunks]);

  const colors = ["var(--color-primary)", "var(--color-accent)"];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">Source mix</h3>
        <p className="text-xs text-muted-foreground">Deliberate 50/50 sample</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={bySource} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
              {bySource.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">Chunk length</h3>
        <p className="text-xs text-muted-foreground">Estimated tokens per chunk</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byLength}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">Textbook coverage</h3>
        <p className="text-xs text-muted-foreground">Chunks sampled per book</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byDoc} layout="vertical" margin={{ left: 60 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
