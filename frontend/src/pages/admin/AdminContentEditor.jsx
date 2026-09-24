import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bold, CalendarClock, Check, ExternalLink, Eye, EyeOff, Heading2, History, ImagePlus, Italic, Link2, List, Loader2, Paperclip, Quote, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArticleBody } from "@/components/shared/ArticleBody";
import { markdownToBlocks } from "@/lib/markdown";
import {
  apiFileUrl, createContent, fetchContentItem, fetchContentVersions, fetchLeadsMeta, formatApiError, publishContent,
  restoreContentVersion, unpublishContent, updateContent, uploadFile,
} from "@/lib/adminApi";
import { fmtDateTime, inputCls, productName, selectCls, useCan } from "@/components/admin/kit";
import { StatusBadge, TYPE_LABELS, sitePath } from "@/pages/admin/AdminContent";

const EMPTY = {
  title: "", type: "blog", slug: "", summary: "", body: "", tag: "", products: [], industries: [], author: "", author_role: "",
  cover_image: "", file_id: "", gated: false, event_date: "", video_url: "", seo_title: "", seo_description: "", source_url: "",
};
const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 100);
const FIELDS = Object.keys(EMPTY);

const Field = ({ label, hint, children, className }) => (
  <label className={cn("block", className)}>
    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
    <div className="mt-1.5">{children}</div>
    {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
  </label>
);

const Chips = ({ options, value, onChange, label, testId }) => (
  <div className="flex flex-wrap gap-1.5" role="group" aria-label={label} data-testid={testId}>
    {options.map((o) => {
      const on = value.includes(o.key);
      return (
        <button key={o.key} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((v) => v !== o.key) : [...value, o.key])} className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors", on ? "border-teal bg-teal/15 text-foreground" : "border-line/15 text-muted-foreground hover:text-foreground")}>{o.label}</button>
      );
    })}
  </div>
);

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const can = useCan();
  const editable = can("editContent");
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [item, setItem] = useState(null);
  const [attached, setAttached] = useState(null); // file uploaded in this session
  const [meta, setMeta] = useState(null);
  const [versions, setVersions] = useState([]);
  const [busy, setBusy] = useState(null);
  const [preview, setPreview] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [slugTouched, setSlugTouched] = useState(!!id);
  const bodyRef = useRef(null);
  const fileInput = useRef(null);
  const coverInput = useRef(null);
  const inlineImageInput = useRef(null);

  useEffect(() => {
    fetchLeadsMeta().then(setMeta).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchContentItem(id)
      .then((d) => {
        const f = Object.fromEntries(FIELDS.map((k) => [k, d[k] ?? EMPTY[k]]));
        setForm(f);
        setSaved(f);
        setItem(d);
      })
      .catch((e) => toast.error(formatApiError(e)));
    fetchContentVersions(id).then(setVersions).catch(() => {});
  }, [id]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  useEffect(() => {
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (patch) => setForm((f) => {
    const next = { ...f, ...patch };
    if ("title" in patch && !slugTouched) next.slug = slugify(patch.title);
    return next;
  });

  const payload = () => Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? (v.trim() || (k === "summary" || k === "body" ? "" : null)) : v]));

  const save = async () => {
    setBusy("save");
    try {
      const d = id ? await updateContent(id, payload()) : await createContent(payload());
      const f = Object.fromEntries(FIELDS.map((k) => [k, d[k] ?? EMPTY[k]]));
      setForm(f);
      setSaved(f);
      setItem(d);
      toast.success(id ? "Saved" : "Draft created");
      if (!id) navigate(`/admin/content/${d.id}`, { replace: true });
      else fetchContentVersions(id).then(setVersions).catch(() => {});
      return d;
    } catch (e) {
      toast.error(formatApiError(e));
      return null;
    } finally {
      setBusy(null);
    }
  };

  const publish = async (when) => {
    const d = dirty || !id ? await save() : item;
    if (!d) return;
    setBusy("publish");
    try {
      const at = when ? new Date(when).toISOString() : null;
      const res = await publishContent(d.id, at);
      setItem(res);
      toast.success(res.status === "scheduled" ? `Scheduled for ${fmtDateTime(res.publish_at)}` : "Published. It's live on the website within a minute.");
      setScheduleAt("");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const unpublish = async () => {
    setBusy("unpublish");
    try {
      setItem(await unpublishContent(id));
      toast.success("Moved back to drafts");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const restore = async (v) => {
    if (!window.confirm(`Restore version ${v.version} (${fmtDateTime(v.saved_at)})? The current text is kept as a version too.`)) return;
    try {
      const d = await restoreContentVersion(id, v.version);
      const f = Object.fromEntries(FIELDS.map((k) => [k, d[k] ?? EMPTY[k]]));
      setForm(f);
      setSaved(f);
      setItem(d);
      fetchContentVersions(id).then(setVersions).catch(() => {});
      toast.success(`Restored version ${v.version}`);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const upload = async (file, kind) => {
    if (!file) return;
    setBusy(`upload-${kind}`);
    try {
      const f = await uploadFile(file);
      if (kind === "file") {
        set({ file_id: f.id });
        setAttached(f);
      } else if (kind === "cover") {
        if (f.kind !== "image") throw new Error("The cover must be an image (PNG, JPEG, WebP or GIF).");
        set({ cover_image: f.public_url });
      } else {
        if (f.kind !== "image") throw new Error("Only images can be placed inside the text.");
        insert(`\n![${file.name.replace(/\.[^.]+$/, "")}](${f.public_url})\n`, "");
      }
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e?.response ? formatApiError(e) : e.message);
    } finally {
      setBusy(null);
    }
  };

  // Markdown toolbar: wrap the selection or insert at the cursor.
  const insert = (before, after = before, placeholder = "") => {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? form.body.length;
    const end = el?.selectionEnd ?? form.body.length;
    const sel = form.body.slice(start, end) || placeholder;
    const next = form.body.slice(0, start) + before + sel + after + form.body.slice(end);
    set({ body: next });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + before.length, start + before.length + sel.length);
    });
  };
  const linePrefix = (prefix) => insert(`\n${prefix}`, "", "Text");

  const blocks = useMemo(() => markdownToBlocks(form.body), [form.body]);
  const productOptions = (meta?.lines || []).flatMap((l) => l.products.map((p) => ({ key: p, label: productName(p), line: l.label })));
  const industryOptions = (meta?.industries || []).map((i) => ({ key: i, label: productName(i) }));
  const live = item?.live;
  const fileInfo = attached?.id === form.file_id ? attached : item?.file?.id === form.file_id ? item.file : null;

  return (
    <div data-testid="admin-content-editor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/admin/content"><ArrowLeft /> All content</Link></Button>
        <div className="flex flex-wrap items-center gap-2">
          {item && <StatusBadge status={item.status} />}
          {item?.status === "scheduled" && <span className="text-xs text-muted-foreground">goes live {fmtDateTime(item.publish_at)}</span>}
          {live && <Button asChild variant="ghost" size="sm"><a href={`${process.env.PUBLIC_URL}${sitePath(saved)}`} target="_blank" rel="noreferrer"><ExternalLink /> View live</a></Button>}
          {editable && (
            <>
              <Button variant="outline" size="sm" onClick={save} disabled={!!busy || (!dirty && !!id) || form.title.trim().length < 3} data-testid="content-save">{busy === "save" ? <Loader2 className="animate-spin" /> : <Check />} {id ? "Save" : "Save draft"}</Button>
              {item && item.status !== "draft" && item.status !== "archived" ? (
                <>
                  {dirty && <Button size="sm" onClick={save} disabled={!!busy} data-testid="content-update">Update live version</Button>}
                  <Button variant="ghost" size="sm" onClick={unpublish} disabled={!!busy}><EyeOff /> Unpublish</Button>
                </>
              ) : (
                <Button size="sm" onClick={() => publish(null)} disabled={!!busy || form.title.trim().length < 3} data-testid="content-publish-now">{busy === "publish" ? <Loader2 className="animate-spin" /> : <Eye />} Publish now</Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <div className="rounded-2xl border border-line/10 bg-card p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Title" className="sm:col-span-2">
                <Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Why Archive-First Is the Fastest Path to S/4HANA" className={cn(inputCls, "h-11 text-base")} disabled={!editable} data-testid="content-title" />
              </Field>
              <Field label="Type">
                <select value={form.type} onChange={(e) => set({ type: e.target.value })} className={cn(selectCls, "h-11 w-full")} disabled={!editable} data-testid="content-type">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="URL" hint={`${window.location.origin}${process.env.PUBLIC_URL}${sitePath({ ...form, slug: form.slug || "…" })}${item?.source_url ? ` · migrated from ${item.source_url}` : ""}`} className="sm:col-span-2">
                <Input value={form.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} className={inputCls} disabled={!editable} data-testid="content-slug" />
              </Field>
              <Field label="Topic label" hint="Short tag shown on the card, e.g. SAP">
                <Input value={form.tag} onChange={(e) => set({ tag: e.target.value })} className={inputCls} disabled={!editable} />
              </Field>
              <Field label="Summary" hint="One or two sentences for cards, search results and social previews." className="sm:col-span-3">
                <Textarea value={form.summary} onChange={(e) => set({ summary: e.target.value })} rows={2} maxLength={600} className="border-line/15 bg-background text-sm" disabled={!editable} data-testid="content-summary" />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-line/10 bg-card">
            <div className="flex flex-wrap items-center gap-1 border-b border-line/10 px-3 py-2">
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => linePrefix("## ")} title="Heading" disabled={!editable}><Heading2 /></Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => insert("**", "**", "bold text")} title="Bold" disabled={!editable}><Bold /></Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => insert("*", "*", "italic text")} title="Italic" disabled={!editable}><Italic /></Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => insert("[", "](https://)", "link text")} title="Link" disabled={!editable}><Link2 /></Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => linePrefix("- ")} title="List" disabled={!editable}><List /></Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => linePrefix("> ")} title="Quote" disabled={!editable}><Quote /></Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => inlineImageInput.current?.click()} title="Image" disabled={!editable || !!busy}>{busy === "upload-inline" ? <Loader2 className="animate-spin" /> : <ImagePlus />}</Button>
              <input ref={inlineImageInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { upload(e.target.files?.[0], "inline"); e.target.value = ""; }} />
              <div className="ml-auto flex rounded-full border border-line/15 p-0.5 text-xs">
                <button type="button" onClick={() => setPreview(false)} className={cn("rounded-full px-3 py-1", !preview && "bg-line/10 text-foreground")}>Write</button>
                <button type="button" onClick={() => setPreview(true)} className={cn("rounded-full px-3 py-1", preview && "bg-line/10 text-foreground")} data-testid="content-preview-toggle">Preview</button>
              </div>
            </div>
            {preview ? (
              <div className="max-h-[70vh] overflow-y-auto p-6" data-testid="content-preview">
                {blocks.length ? <ArticleBody blocks={blocks} /> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}
              </div>
            ) : (
              <Textarea
                ref={bodyRef}
                value={form.body}
                onChange={(e) => set({ body: e.target.value })}
                rows={22}
                placeholder={"## A heading\n\nWrite in Markdown: **bold**, *italic*, [links](https://...), lists with -, quotes with >.\n\n:::callout Key takeaway\nCallouts are highlighted on the page.\n:::"}
                className="min-h-[420px] resize-y rounded-none rounded-b-2xl border-0 bg-transparent p-5 font-mono text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={!editable}
                data-testid="content-body"
              />
            )}
          </div>
        </div>

        <aside className="space-y-5 xl:col-span-4">
          {editable && item && item.status === "draft" && (
            <div className="rounded-2xl border border-line/10 bg-card p-5">
              <p className="flex items-center gap-2 text-sm font-medium"><CalendarClock className="h-4 w-4 text-teal" /> Schedule</p>
              <div className="mt-3 flex gap-2">
                <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={cn(inputCls, "h-9")} data-testid="content-schedule-at" />
                <Button size="sm" variant="outline" disabled={!scheduleAt || !!busy} onClick={() => publish(scheduleAt)} data-testid="content-schedule">Schedule</Button>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">Goes live automatically at this time (your local time zone).</p>
            </div>
          )}

          <div className="rounded-2xl border border-line/10 bg-card p-5">
            <p className="text-sm font-medium">Lead intent</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Which products is this about? Readers and downloaders score interest in them, which tags their lead to that product line.</p>
            <div className="mt-3"><Chips options={productOptions} value={form.products} onChange={(products) => set({ products })} label="Products" testId="content-products" /></div>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Industries</p>
            <div className="mt-2"><Chips options={industryOptions} value={form.industries} onChange={(industries) => set({ industries })} label="Industries" /></div>
          </div>

          <div className="rounded-2xl border border-line/10 bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-medium"><Paperclip className="h-4 w-4 text-teal" /> Download & access</p>
            <div className="mt-3 flex items-center gap-2">
              {form.file_id ? (
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-line/10 bg-background px-3 py-2 text-xs">
                  {fileInfo ? <a href={apiFileUrl(fileInfo.url)} target="_blank" rel="noreferrer" className="truncate text-teal hover:underline">{fileInfo.name}</a> : <span className="truncate">Attached file</span>}
                  {fileInfo && <span className="shrink-0 text-muted-foreground">{Math.round(fileInfo.size / 1024)} KB</span>}
                  {editable && <button type="button" onClick={() => set({ file_id: "" })} aria-label="Remove file"><X className="h-3.5 w-3.5" /></button>}
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={!editable || !!busy} data-testid="content-attach">{busy === "upload-file" ? <Loader2 className="animate-spin" /> : <Upload />} Attach PDF / deck</Button>
              )}
              <input ref={fileInput} type="file" accept=".pdf,.pptx,.docx,.xlsx,image/*" className="hidden" onChange={(e) => { upload(e.target.files?.[0], "file"); e.target.value = ""; }} data-testid="content-file-input" />
            </div>
            <label className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span>Gate behind a form<span className="block text-[11px] text-muted-foreground">Readers see the first part, then give their details to unlock the rest and the download.</span></span>
              <Switch checked={form.gated} onCheckedChange={(gated) => set({ gated })} disabled={!editable} data-testid="content-gated" />
            </label>
            <Field label="Video / recording link" hint="Webinars and podcasts: an https:// link" className="mt-4">
              <Input value={form.video_url} onChange={(e) => set({ video_url: e.target.value })} className={inputCls} disabled={!editable} />
            </Field>
            {form.type === "event" && (
              <Field label="Event date" className="mt-4"><Input value={form.event_date} onChange={(e) => set({ event_date: e.target.value })} placeholder="e.g. 14 Oct 2026, Santa Clara" className={inputCls} disabled={!editable} /></Field>
            )}
          </div>

          <div className="rounded-2xl border border-line/10 bg-card p-5">
            <p className="text-sm font-medium">Cover & byline</p>
            <div className="mt-3">
              {form.cover_image ? (
                <div className="relative">
                  <img src={apiFileUrl(form.cover_image)} alt="" className="aspect-[16/9] w-full rounded-lg border border-line/10 object-cover" />
                  {editable && <button type="button" onClick={() => set({ cover_image: "" })} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/80" aria-label="Remove cover"><X className="h-3.5 w-3.5" /></button>}
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => coverInput.current?.click()} disabled={!editable || !!busy}>{busy === "upload-cover" ? <Loader2 className="animate-spin" /> : <ImagePlus />} Upload cover image</Button>
              )}
              <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { upload(e.target.files?.[0], "cover"); e.target.value = ""; }} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Author"><Input value={form.author} onChange={(e) => set({ author: e.target.value })} placeholder="Solix SAP Practice" className={inputCls} disabled={!editable} /></Field>
              <Field label="Author role"><Input value={form.author_role} onChange={(e) => set({ author_role: e.target.value })} placeholder="ERP archiving & migration" className={inputCls} disabled={!editable} /></Field>
            </div>
          </div>

          <div className="rounded-2xl border border-line/10 bg-card p-5">
            <p className="text-sm font-medium">Search & social</p>
            <Field label="SEO title" hint={`${(form.seo_title || form.title).length}/60 characters`} className="mt-3"><Input value={form.seo_title} onChange={(e) => set({ seo_title: e.target.value })} placeholder={form.title} className={inputCls} disabled={!editable} /></Field>
            <Field label="Meta description" hint={`${(form.seo_description || form.summary).length}/155 characters`} className="mt-3"><Textarea value={form.seo_description} onChange={(e) => set({ seo_description: e.target.value })} placeholder={form.summary} rows={2} className="border-line/15 bg-background text-sm" disabled={!editable} /></Field>
          </div>

          {versions.length > 0 && (
            <div className="rounded-2xl border border-line/10 bg-card p-5">
              <p className="flex items-center gap-2 text-sm font-medium"><History className="h-4 w-4 text-teal" /> Version history</p>
              <ul className="mt-2 divide-y divide-line/5 text-xs">
                {versions.map((v) => (
                  <li key={`${v.version}-${v.saved_at}`} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0"><span className="block truncate text-foreground">v{v.version} · {v.title}</span><span className="text-muted-foreground">{fmtDateTime(v.saved_at)} · {v.saved_by}</span></span>
                    {editable && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => restore(v)}>Restore</Button>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// A fresh editor per item: moving from one item (or "new") to another never carries state over.
export default function AdminContentEditor() {
  const { id } = useParams();
  return <Editor key={id || "new"} />;
}
