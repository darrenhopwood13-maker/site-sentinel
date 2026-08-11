import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { today, type Entry, type Section, type Zone } from "./site-log";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

export function useDayEntries(enabled: boolean) {
  return useQuery({
    queryKey: ["entries", today()],
    enabled,
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from("entries")
        .select("id,section,zone,source,label,photo_path,check_me,captured_at")
        .eq("day", today())
        .order("captured_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Entry[];
    },
  });
}

export function useDayFindings(enabled: boolean) {
  return useQuery({
    queryKey: ["findings", today()],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("findings").select("*").eq("day", today());
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDaySnags(enabled: boolean) {
  return useQuery({
    queryKey: ["snags", today()],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("snags").select("*").eq("day", today());
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDayActions() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["entries", today()] });
    qc.invalidateQueries({ queryKey: ["findings", today()] });
    qc.invalidateQueries({ queryKey: ["snags", today()] });
  };

  const addTap = async (userId: string, section: Section, zone: Zone, label: string) => {
    await supabase.from("entries").insert({ user_id: userId, section, zone, source: "tap", label });
    await supabase
      .from("memory")
      .upsert(
        { user_id: userId, kind: "issue", value: label, last_used: new Date().toISOString() },
        { onConflict: "user_id,kind,value" },
      );
    refresh();
  };

  const confirmEntry = async (id: string) => {
    await supabase.from("entries").update({ check_me: false }).eq("id", id);
    await supabase.from("findings").update({ check_me: false }).eq("entry_id", id);
    await supabase.from("snags").update({ check_me: false }).eq("entry_id", id);
    refresh();
  };

  const removeEntry = async (id: string) => {
    await supabase.from("entries").delete().eq("id", id);
    refresh();
  };

  const uploadPhoto = async (userId: string, zone: Zone, file: File) => {
    const path = `${userId}/${today()}/${crypto.randomUUID()}.jpg`;
    const up = await supabase.storage.from("site-photos").upload(path, file, {
      contentType: file.type || "image/jpeg",
    });
    if (up.error) throw up.error;
    const { data, error } = await supabase
      .from("entries")
      .insert({
        user_id: userId,
        section: "Photos",
        zone,
        source: "photo",
        label: "Photo captured — reading…",
        photo_path: path,
        check_me: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    refresh();
    return { entryId: data.id as string, path };
  };

  return { addTap, confirmEntry, removeEntry, uploadPhoto, refresh };
}

export function usePhotoUrl(path?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let live = true;
    supabase.storage
      .from("site-photos")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (live) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      live = false;
    };
  }, [path]);
  return url;
}