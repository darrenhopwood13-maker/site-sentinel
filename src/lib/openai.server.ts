const OPENAI = "https://api.openai.com/v1";

function key() {
  const k = process.env["OPENAI_API_KEY"];
  if (!k) throw new Error("OpenAI key is not configured");
  return k;
}

export async function chatJSON(
  system: string,
  user: unknown,
  images: string[] = [],
  model = "gpt-4o",
): Promise<Record<string, unknown>> {
  const content: unknown[] = [
    { type: "text", text: typeof user === "string" ? user : JSON.stringify(user) },
    ...images.map((url) => ({ type: "image_url", image_url: { url } })),
  ];
  const res = await fetch(`${OPENAI}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key()}` },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Vision/LLM request failed (${res.status})`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return JSON.parse(data.choices[0]?.message?.content ?? "{}") as Record<string, unknown>;
}

export async function chatText(system: string, user: string, model = "gpt-4o"): Promise<string> {
  const res = await fetch(`${OPENAI}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key()}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`LLM request failed (${res.status})`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

export async function transcribe(bytes: Uint8Array, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([bytes as BlobPart]), filename);
  form.append("model", "whisper-1");
  form.append("language", "en");
  const res = await fetch(`${OPENAI}/audio/transcriptions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key()}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Transcription failed (${res.status})`);
  const data = (await res.json()) as { text: string };
  return data.text;
}