export type Chunk = {
  i: number;
  id: string;
  t: string;
  st: "textbook" | "statpearls";
  d: string;
  s: string | null;
  tk: number;
  x: number;
  y: number;
  nb: [number, number][];
};

let cache: Promise<Chunk[]> | null = null;

export function loadCorpus(): Promise<Chunk[]> {
  if (!cache) {
    cache = fetch("/data/corpus.json").then((r) => {
      if (!r.ok) throw new Error("Could not load the corpus");
      return r.json() as Promise<Chunk[]>;
    });
  }
  return cache;
}

const STOP = new Set(
  "a an and are as at be by for from how in is it of on or that the this to was what when where which who why with does do can causes cause".split(
    " ",
  ),
);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

type Index = {
  df: Map<string, number>;
  tf: Map<string, number>[];
  len: number[];
  avg: number;
  n: number;
};

let indexCache: Index | null = null;

function buildIndex(chunks: Chunk[]): Index {
  if (indexCache) return indexCache;
  const df = new Map<string, number>();
  const tf: Map<string, number>[] = [];
  const len: number[] = [];
  for (const c of chunks) {
    const words = tokenize(c.t);
    const m = new Map<string, number>();
    for (const w of words) m.set(w, (m.get(w) ?? 0) + 1);
    for (const w of m.keys()) df.set(w, (df.get(w) ?? 0) + 1);
    tf.push(m);
    len.push(words.length);
  }
  const avg = len.reduce((a, b) => a + b, 0) / len.length;
  indexCache = { df, tf, len, avg, n: chunks.length };
  return indexCache;
}

export type Hit = { chunk: Chunk; score: number };

/** BM25 ranking over the sampled corpus. */
export function search(chunks: Chunk[], query: string, topK = 8): Hit[] {
  const terms = tokenize(query);
  if (!terms.length) return [];
  const idx = buildIndex(chunks);
  const k1 = 1.5;
  const b = 0.75;
  const scores = new Float64Array(idx.n);
  for (const term of new Set(terms)) {
    const df = idx.df.get(term);
    if (!df) continue;
    const idf = Math.log(1 + (idx.n - df + 0.5) / (df + 0.5));
    for (let i = 0; i < idx.n; i++) {
      const f = idx.tf[i].get(term);
      if (!f) continue;
      scores[i] += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * idx.len[i]) / idx.avg)));
    }
  }
  const order: Hit[] = [];
  for (let i = 0; i < idx.n; i++) if (scores[i] > 0) order.push({ chunk: chunks[i], score: scores[i] });
  order.sort((a, b2) => b2.score - a.score);
  return order.slice(0, topK);
}

export function label(c: Chunk): string {
  return c.s ? `${c.d} — ${c.s}` : c.d;
}
