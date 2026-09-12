import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AskInput = z.object({
  question: z.string().min(3).max(500),
  contexts: z
    .array(z.object({ id: z.string(), source: z.string(), text: z.string().max(4000) }))
    .min(1)
    .max(8),
});

export const askMedRag = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this project.");

    const context = data.contexts
      .map((c, i) => `[S${i + 1}] (${c.source} · ${c.id})\n${c.text}`)
      .join("\n\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          {
            role: "system",
            content:
              "You answer medical questions using the retrieved passages provided. " +
              "Synthesize everything relevant across the passages, including partial or indirect evidence, " +
              "and cite each claim with markers like [S1], [S2]. Only if the passages are genuinely unrelated " +
              "to the question, say the corpus does not cover it. Never invent facts beyond the passages. " +
              "Keep answers under 180 words. This is an educational retrieval demo, not clinical advice.",

          },
          { role: "user", content: `Question: ${data.question}\n\nRetrieved passages:\n${context}` },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Too many requests right now — try again in a moment.");
      if (res.status === 402)
        throw new Error("AI credits are exhausted for this workspace. Add credits in Lovable to continue.");
      throw new Error(`AI request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const answer = json.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("The model returned an empty answer.");
    return { answer };
  });
