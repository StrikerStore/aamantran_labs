import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';

/**
 * All sandbox state for the Test page: content, schema, presets and the
 * cache-busting nonce the preview iframe rides on.
 *
 * The single reason this is a hook rather than page-local state is that every
 * write has to reload the iframe. Keeping the nonce next to the mutations means
 * a developer never has to remember to hit refresh, which was the main cost of
 * the old two-page flow.
 */

const DEFAULT_PRESET = 'full';

/* -- Per-template scratch state -------------------------------------------
   The backend deliberately keeps no per-developer UI state: a reseed
   delete-and-recreates the event, so anything stored server-side would be
   wiped on every preset change. Which scenarios have been reviewed is a
   property of the developer's session, not of the sandbox, so it lives here. */

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private mode or a full quota. The checklist is a convenience, not data. */
  }
}

const checkedKey  = (id) => `lab_checked_${id}`;
const presetKey   = (id) => `lab_preset_${id}`;
const analysisKey = (id) => `lab_analysis_${id}`;

/* -- Schema suggestion ---------------------------------------------------- */

const TEXTAREA_HINTS = /(story|note|message|about|desc|bio|detail|address|quote)/i;

function titleize(key) {
  const words = String(key).replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Merge the keys the HTML actually uses into the declared schema.
 *
 * Additive on purpose: a developer who already wrote a good label for a key
 * should not lose it because they pressed the suggest button, so existing
 * entries are left untouched and only missing ones are appended.
 */
function mergeSuggestions(current, used) {
  if (!used) return null;

  const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  const next = { ...base };

  const existing = (section, prop) =>
    new Set((Array.isArray(base[section]) ? base[section] : []).map((r) => String(r?.[prop] || '')));

  const haveCustom = existing('customFields', 'key');
  const haveRoles  = existing('people', 'role');
  const haveSlots  = existing('mediaSlots', 'key');

  const newCustom = (used.customKeys || [])
    .filter((k) => !haveCustom.has(k))
    .map((key) => ({
      key,
      label: titleize(key),
      type: TEXTAREA_HINTS.test(key) ? 'textarea' : 'text',
    }));

  const newRoles = (used.roles || [])
    .filter((r) => !haveRoles.has(r))
    .map((role) => ({ role, label: titleize(role), photo: false }));

  const newSlots = (used.mediaSlots || [])
    .filter((s) => !haveSlots.has(s))
    .map((key) => ({ key, label: titleize(key), type: 'photo', multiple: true }));

  const added = newCustom.length + newRoles.length + newSlots.length;
  if (!added) return { schema: next, added: 0 };

  if (newCustom.length) next.customFields = [...(base.customFields || []), ...newCustom];
  if (newRoles.length)  next.people       = [...(base.people || []), ...newRoles];
  if (newSlots.length)  next.mediaSlots   = [...(base.mediaSlots || []), ...newSlots];

  return { schema: next, added };
}

/* -- Hook ----------------------------------------------------------------- */

export function useSandbox() {
  const toast = useToast();

  const [data, setData]       = useState(null);
  const [assets, setAssets]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);

  const [schemaText, setSchemaText] = useState('');
  const [form, setForm]             = useState(null);
  const [analysis, setAnalysis]     = useState(null);

  const [activePreset, setActivePreset] = useState(DEFAULT_PRESET);
  const [checked, setChecked]           = useState([]);

  // Bumped after every write so the iframe re-fetches the freshly seeded render.
  const [nonce, setNonce] = useState(0);

  const templateId = data?.event?.template?.id || null;
  // Keeps the restore effect from re-running on every render of the same template.
  const restoredFor = useRef(null);

  const load = useCallback(async () => {
    try {
      const [sandbox, assetList] = await Promise.all([api.sandbox.get(), api.assets.list()]);
      setData(sandbox);
      setAssets(assetList.assets || []);

      const id = sandbox.event?.template?.id;
      if (id) {
        const schema = await api.templates.getSchema(id);
        setSchemaText(schema.fieldSchema ? JSON.stringify(schema.fieldSchema, null, 2) : '');
      } else {
        setSchemaText('');
      }

      const c = sandbox.content;
      setForm(c ? {
        groomName: sandbox.event?.groomName || '',
        brideName: sandbox.event?.brideName || '',
        instagramUrl:     c.links.instagramUrl     || '',
        instagramHashtag: c.links.instagramHashtag || '',
        socialYoutubeUrl: c.links.socialYoutubeUrl || '',
        websiteUrl:       c.links.websiteUrl       || '',
        rsvpEnabled:       c.toggles.rsvpEnabled,
        guestNotesEnabled: c.toggles.guestNotesEnabled,
        musicUrl: c.media?.find((m) => m.type === 'music')?.url || '',
        customFields: (c.customFields || []).map((f) => ({ ...f })),
      } : null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // Restore the checklist, last scenario and last analysis for this template.
  useEffect(() => {
    if (!templateId || restoredFor.current === templateId) return;
    restoredFor.current = templateId;
    setChecked(readStore(checkedKey(templateId), []));
    setActivePreset(readStore(presetKey(templateId), DEFAULT_PRESET));
    setAnalysis(readStore(analysisKey(templateId), null));
  }, [templateId]);

  const reloadPreview = useCallback(() => setNonce((n) => n + 1), []);

  /** Run a mutation, surface the outcome, refresh data and reload the preview. */
  const run = useCallback(async (fn, msg) => {
    setBusy(true);
    try {
      const res = await fn();
      if (msg) toast(msg, 'success');
      await load();
      setNonce((n) => n + 1);
      return res;
    } catch (err) {
      toast(err.message, 'error');
      return null;
    } finally {
      setBusy(false);
    }
  }, [load, toast]);

  /** Keep the newest analysis so the suggest button works after a reload. */
  const rememberAnalysis = useCallback((next) => {
    if (!next) return;
    setAnalysis(next);
    if (templateId) writeStore(analysisKey(templateId), next);
  }, [templateId]);

  const setField = useCallback((key, value) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  /* -- Mutations ---------------------------------------------------------- */

  const applyPreset = useCallback(async (key) => {
    const label = data?.presets?.[key]?.label || key;
    const res = await run(() => api.sandbox.preset(key), `Applied: ${label}`);
    if (!res) return;

    setActivePreset(key);
    if (templateId) writeStore(presetKey(templateId), key);

    setChecked((prev) => {
      if (prev.includes(key)) return prev;
      const next = [...prev, key];
      if (templateId) writeStore(checkedKey(templateId), next);
      return next;
    });
  }, [run, data, templateId]);

  const saveContent = useCallback(async () => {
    if (!form) return;
    await run(
      () => api.sandbox.save({
        groomName: form.groomName,
        brideName: form.brideName,
        links: {
          instagramUrl:     form.instagramUrl,
          instagramHashtag: form.instagramHashtag,
          socialYoutubeUrl: form.socialYoutubeUrl,
          websiteUrl:       form.websiteUrl,
        },
        toggles: {
          rsvpEnabled:       form.rsvpEnabled,
          guestNotesEnabled: form.guestNotesEnabled,
        },
        customFields: form.customFields,
        musicUrl: form.musicUrl,
      }),
      'Saved. Preview reloaded.',
    );
  }, [form, run]);

  const saveSchema = useCallback(async () => {
    if (!templateId) return;

    let parsed = null;
    if (schemaText.trim()) {
      try {
        parsed = JSON.parse(schemaText);
      } catch (err) {
        toast(`Schema is not valid JSON: ${err.message}`, 'error');
        return;
      }
    }

    // Saving a schema reseeds the event, and the backend falls back to the
    // default preset when none is given. Passing the active one keeps the
    // scenario under test from silently flipping back to "everything filled".
    const res = await run(
      () => api.templates.putSchema(templateId, { fieldSchema: parsed, preset: activePreset }),
      'Schema saved. Sample values re-derived.',
    );
    if (res?.analysis) rememberAnalysis(res.analysis);
  }, [templateId, schemaText, activePreset, run, toast, rememberAnalysis]);

  const resetSandbox = useCallback(async () => {
    const res = await run(() => api.sandbox.reset(), 'Sandbox reset to the default dataset');
    if (!res) return;
    setActivePreset(DEFAULT_PRESET);
    if (templateId) writeStore(presetKey(templateId), DEFAULT_PRESET);
  }, [run, templateId]);

  /** Fill the editor with every key the uploaded HTML actually references. */
  const suggestSchema = useCallback(() => {
    const used = analysis?.used;
    if (!used) {
      toast('Upload or save the template once so its HTML can be scanned', 'error');
      return;
    }

    let current = null;
    if (schemaText.trim()) {
      try {
        current = JSON.parse(schemaText);
      } catch {
        toast('Fix the JSON already in the editor first', 'error');
        return;
      }
    }

    const result = mergeSuggestions(current, used);
    if (!result || result.added === 0) {
      toast('Nothing to add. Every key the HTML uses is already declared.', 'success');
      return;
    }

    setSchemaText(JSON.stringify(result.schema, null, 2));
    const plural = result.added === 1 ? '' : 's';
    toast(`Added ${result.added} declaration${plural}. Review, then save.`, 'success');
  }, [analysis, schemaText, toast]);

  const clearChecklist = useCallback(() => {
    setChecked([]);
    if (templateId) writeStore(checkedKey(templateId), []);
  }, [templateId]);

  /* -- Derived ------------------------------------------------------------ */

  const presets = useMemo(() => data?.presets || {}, [data]);
  const presetKeys = useMemo(() => Object.keys(presets), [presets]);
  const previewUrl = data?.urls?.preview || '';

  return {
    loading, busy,
    data, assets, presets, presetKeys,
    event: data?.event || null,
    previewUrl, nonce, reloadPreview,

    form, setField,
    schemaText, setSchemaText,
    analysis, suggestSchema,

    activePreset, checked, clearChecklist,

    applyPreset, saveContent, saveSchema, resetSandbox,
  };
}
