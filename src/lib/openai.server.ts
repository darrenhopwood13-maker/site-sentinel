type Provider = {
  baseUrl: string;
  key: string;
  model: string;
  visionModel: string | null;
  supportsVision: boolean;
  supportsAudio: boolean;
};

// Lovable AI (built-in). Gemini handles both text and vision.
const MODEL = "google/gemini-3.6-flash";

function getProvider(): Provider {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Lovable AI is not configured (missing LOVABLE_API_KEY).");
  return {
    baseUrl: "https://ai.gateway.lovable.dev/v1",
    key,
    model: MODEL,
    visionModel: MODEL,
    supportsVision: true,
    supportsAudio: false,
  };
}

export async function chatJSON(
  system: string,
  user: unknown,
  images: string[] = [],
  model?: string,
): Promise<Record<string, unknown>> {
  const p = getProvider();
  if (images.length > 0 && !p.supportsVision) {
    throw new Error(
      "Vision is not configured for this provider. Set DEEPSEEK_VISION_MODEL if your DeepSeek model supports images.",
    );
  }

  const content: unknown[] = [
    { type: "text", text: typeof user === "string" ? user : JSON.stringify(user) },
    ...images.map((url) => ({ type: "image_url", image_url: { url } })),
  ];

  const chosenModel =
    model ?? (images.length > 0 && p.visionModel ? p.visionModel : p.model);

  const res = await fetch(`${p.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Lovable-API-Key": p.key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: chosenModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Vision/LLM request failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return JSON.parse(data.choices[0]?.message?.content ?? "{}") as Record<string, unknown>;
}

export async function chatText(system: string, user: string, model?: string): Promise<string> {
  const p = getProvider();
  const res = await fetch(`${p.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Lovable-API-Key": p.key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: model ?? p.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

export async function transcribe(bytes: Uint8Array, filename: string): Promise<string> {
  const p = getProvider();
  if (!p.supportsAudio) {
    throw new Error(
      "Audio transcription is not available with this provider. Voice capture now uses your browser's speech recognition instead.",
    );
  }
  const form = new FormData();
  form.append("file", new Blob([bytes as BlobPart]), filename);
  form.append("model", "whisper-1");
  form.append("language", "en");
  const res = await fetch(`${p.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: { authorization: `Bearer ${p.key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Transcription failed (${res.status})`);
  const data = (await res.json()) as { text: string };
  return data.text;
}
