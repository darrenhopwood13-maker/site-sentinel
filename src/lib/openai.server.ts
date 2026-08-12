type Provider = {
  baseUrl: string;
  key: string;
  model: string;
  visionModel: string | null;
  supportsVision: boolean;
  supportsAudio: boolean;
};

function getProvider(): Provider {
  const genericKey = process.env["LLM_API_KEY"];
  const genericBase = process.env["LLM_BASE_URL"];
  const deepseekKey = process.env["DEEPSEEK_API_KEY"];
  const openaiKey = process.env["OPENAI_API_KEY"];

  if (genericKey) {
    return {
      baseUrl: genericBase || "https://api.openai.com/v1",
      key: genericKey,
      model: process.env["LLM_MODEL"] || "gpt-4o",
      visionModel: process.env["LLM_VISION_MODEL"] || "gpt-4o",
      supportsVision: true,
      supportsAudio: !!openaiKey,
    };
  }

  if (deepseekKey) {
    return {
      baseUrl: "https://api.deepseek.com/v1",
      key: deepseekKey,
      model: process.env["DEEPSEEK_MODEL"] || "deepseek-chat",
      visionModel: process.env["DEEPSEEK_VISION_MODEL"] || null,
      supportsVision: !!process.env["DEEPSEEK_VISION_MODEL"],
      supportsAudio: false,
    };
  }

  if (openaiKey) {
    return {
      baseUrl: "https://api.openai.com/v1",
      key: openaiKey,
      model: process.env["OPENAI_MODEL"] || "gpt-4o",
      visionModel: process.env["OPENAI_VISION_MODEL"] || "gpt-4o",
      supportsVision: true,
      supportsAudio: true,
    };
  }

  throw new Error(
    "No LLM API key configured. Add DEEPSEEK_API_KEY, OPENAI_API_KEY, or LLM_API_KEY.",
  );
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
      authorization: `Bearer ${p.key}`,
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
  if (!res.ok) throw new Error(`Vision/LLM request failed (${res.status})`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return JSON.parse(data.choices[0]?.message?.content ?? "{}") as Record<string, unknown>;
}

export async function chatText(system: string, user: string, model?: string): Promise<string> {
  const p = getProvider();
  const res = await fetch(`${p.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${p.key}`,
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
