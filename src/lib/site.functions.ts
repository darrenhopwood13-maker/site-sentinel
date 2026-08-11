import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const analyzePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { path: string; zone: string; entryId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { chatJSON } = await import("./openai.server");
    const { HOUSEKEEPING_CATEGORIES } = await import("./housekeeping");

    const signed = await supabase.storage.from("site-photos").createSignedUrl(data.path, 600);
    if (!signed.data?.signedUrl) throw new Error("Could not read the photo");

    const { data: settings } = await supabase
      .from("settings")
      .select("key,value")
      .in("key", ["snag_master_system", "snag_master_blueprint"]);
    const s = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value]));

    const system = [
      "You are instructReport's site photo analyst for a UK construction site.",
      "Read the photo and return STRICT JSON only.",
      "Never guess: if you are not confident about any field, set confident=false so the site manager can confirm.",
      "Classify the photo into exactly one section of: Progress, Deliveries, Labour, Plant, Issues, Safety, Visitors, Photos.",
      `Assess it against these housekeeping categories: ${HOUSEKEEPING_CATEGORIES.join("; ")}. Each category must be 'clear' or 'finding'. A finding is a finding — never average or soften it. Grade each finding green/amber/red.`,
      "Identify defects using this engine: " + (s["snag_master_system"] ?? ""),
      "Snag structure guidance: " + (s["snag_master_blueprint"] ?? ""),
      "Cite UK regs (Building Regulations Approved Documents, BS / BS EN, NHBC Standards, RICS, CDM 2015, HSE guidance). If unsure of an exact clause number, cite the document and section name only — never fabricate a clause number. Omit the citation if none applies.",
      'JSON shape: {"section":string,"label":string,"quantity":string|null,"supplier":string|null,"people":string[],"confident":boolean,"housekeeping":[{"category":string,"status":"clear"|"finding","grade":"green"|"amber"|"red","line_1":string,"line_2":string,"line_3":string,"citation":string|null}],"snags":[{"trade":string,"location":string,"verdict":string,"description":string,"severity":"cosmetic"|"functional"|"structural","likely_cause":string,"rectification":string,"close_out":string,"citation":string|null}]}',
    ].join("\n");

    const result = (await chatJSON(
      system,
      `Zone: ${data.zone}. Analyse this site photo.`,
      [signed.data.signedUrl],
    )) as any;

    const confident = result.confident === true;
    const label: string = result.label || "Site photo";

    await supabase
      .from("entries")
      .update({
        section: result.section || "Photos",
        label,
        check_me: !confident,
        detail: {
          quantity: result.quantity ?? null,
          supplier: result.supplier ?? null,
          people: result.people ?? [],
        },
      })
      .eq("id", data.entryId);

    const findings = (result.housekeeping ?? []).map((h: any) => ({
      user_id: userId,
      entry_id: data.entryId,
      zone: data.zone,
      category: h.category,
      status: h.status === "finding" ? "finding" : "clear",
      grade: ["green", "amber", "red"].includes(h.grade) ? h.grade : "amber",
      line_1: h.line_1 || h.category,
      line_2: h.line_2 ?? null,
      line_3: h.line_3 ?? null,
      citation: h.citation ?? null,
      photo_path: data.path,
      check_me: !confident,
    }));
    if (findings.length) await supabase.from("findings").insert(findings);

    const snags = (result.snags ?? []).map((n: any) => ({
      user_id: userId,
      entry_id: data.entryId,
      zone: data.zone,
      trade: n.trade || "General",
      location: n.location || data.zone,
      verdict: n.verdict ?? null,
      description: n.description || label,
      severity: ["cosmetic", "functional", "structural"].includes(n.severity)
        ? n.severity
        : "cosmetic",
      likely_cause: n.likely_cause ?? null,
      rectification: n.rectification ?? null,
      close_out: n.close_out ?? null,
      citation: n.citation ?? null,
      photo_path: data.path,
      check_me: !confident,
    }));
    if (snags.length) await supabase.from("snags").insert(snags);

    if (result.supplier)
      await supabase
        .from("memory")
        .upsert(
          { user_id: userId, kind: "supplier", value: result.supplier, last_used: new Date().toISOString() },
          { onConflict: "user_id,kind,value" },
        );

    return { label, confident, findings: findings.length, snags: snags.length };
  });

export const fileVoiceNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { audioBase64: string; filename: string; zone: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { transcribe, chatJSON } = await import("./openai.server");

    const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
    const text = await transcribe(bytes, data.filename);

    const filed = (await chatJSON(
      [
        "You file UK site manager voice notes into a daily site report.",
        "Return STRICT JSON: {\"section\":one of Progress|Deliveries|Labour|Plant|Issues|Safety|Visitors|Photos,\"label\":short clean sentence,\"confident\":boolean}.",
        "Never invent detail that is not in the note. If ambiguous, set confident=false.",
      ].join("\n"),
      `Zone: ${data.zone}. Voice note: "${text}"`,
    )) as any;

    const { data: row, error } = await supabase
      .from("entries")
      .insert({
        user_id: userId,
        section: filed.section || "Issues",
        zone: data.zone,
        source: "voice",
        label: filed.label || text,
        detail: { transcript: text },
        check_me: filed.confident !== true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return { id: row.id, transcript: text, section: filed.section, confident: filed.confident === true };
  });

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kind: "customer" | "housekeeping" | "snag"; clientName?: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { chatText } = await import("./openai.server");
    const { DISCLAIMER_TEXT, HOUSEKEEPING_CATEGORIES } = await import("./housekeeping");

    const day = new Date().toISOString().slice(0, 10);
    const [{ data: entries }, { data: findings }, { data: snags }, { data: settings }] =
      await Promise.all([
        supabase.from("entries").select("*").eq("day", day).order("captured_at"),
        supabase.from("findings").select("*").eq("day", day),
        supabase.from("snags").select("*").eq("day", day),
        supabase.from("settings").select("key,value"),
      ]);
    const s = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value]));

    const { data: format } = await supabase
      .from("memory")
      .select("payload")
      .eq("kind", "client_format")
      .eq("value", data.clientName ?? "default")
      .maybeSingle();

    let system = "";
    if (data.kind === "snag") {
      system = `${s["snag_master_system"] ?? ""}\n\n${s["snag_master_blueprint"] ?? ""}\n\nGroup the output by trade, then by location. Every snag must show its photo reference, zone and timestamp. End with: ${DISCLAIMER_TEXT}`;
    } else if (data.kind === "housekeeping") {
      system = `You write a clean, client-facing site housekeeping / site condition report for a UK construction site. No persona, no opinion, no filler. Cover exactly these categories: ${HOUSEKEEPING_CATEGORIES.join("; ")}. State each as clear or finding, give each zone an overall Green/Amber/Red grade, and never average a red away. Every finding must cite photo, zone and timestamp, plus a UK regulation reference where one applies (document and section name only if the exact clause is uncertain — never fabricate a clause number). Keep it as short dashboard-style lines, not prose. End with: ${DISCLAIMER_TEXT}`;
    } else {
      system = `You write a clean, client-facing daily progress report for a UK construction site. No persona, no opinion, no padding. Short dashboard-style lines grouped by section. ${format?.payload ? `Follow this remembered client format: ${JSON.stringify(format.payload)}.` : ""} End with: ${DISCLAIMER_TEXT}`;
    }

    const body = await chatText(
      system,
      JSON.stringify({ day, client: data.clientName ?? null, entries, findings, snags }),
    );

    const grades = (findings ?? []).filter((f) => f.status === "finding").map((f) => f.grade);
    const overall = grades.includes("red") ? "red" : grades.includes("amber") ? "amber" : "green";

    const { data: saved, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        kind: data.kind,
        client_name: data.clientName ?? null,
        overall_grade: data.kind === "housekeeping" ? overall : null,
        content: { body },
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return { id: saved.id, body, overall };
  });

export const askOracle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { question: string }) => data)
  .handler(async ({ data, context }) => {
    const { chatText } = await import("./openai.server");
    const { data: row } = await context.supabase
      .from("settings")
      .select("value")
      .eq("key", "oracle_persona")
      .single();
    return { answer: await chatText(row?.value ?? "", data.question) };
  });

export const transcribeOnly = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { audioBase64: string; filename: string }) => data)
  .handler(async ({ data }) => {
    const { transcribe } = await import("./openai.server");
    const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
    return { transcript: await transcribe(bytes, data.filename) };
  });

const _unusedAskOracleTail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { question: string }) => data)
  .handler(async ({ data, context }) => {
    const { chatText } = await import("./openai.server");
    const { data: row } = await context.supabase
      .from("settings")
      .select("value")
      .eq("key", "oracle_persona")
      .single();
    return { answer: await chatText(row?.value ?? "", data.question) };
  });