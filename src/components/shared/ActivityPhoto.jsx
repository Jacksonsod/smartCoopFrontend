import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
export default function ActivityPhoto({ activityId, allowUpload = false, initialDocumentId = null }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const inputId = useId();
  const [documentId, setDocumentId] = useState(initialDocumentId);
  const [enteredId, setEnteredId] = useState('');
  const [url, setUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const locked = useRef(false);
  const canUpload = allowUpload && ['COOP_ADMIN','FIELD_OFFICER'].includes(user?.role);
  useEffect(() => {
    if (!documentId) return;
    let active = true, objectUrl;
    setUrl(null); setMessage('photos.loading');
    api.get(`/documents/${documentId}/file`, { responseType: 'blob', quietForbidden: true }).then(({ data }) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(data); setUrl(objectUrl); setMessage('');
    }).catch(() => { if (active) setMessage('photos.unavailable'); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [documentId, loadVersion]);
  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || locked.current) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setMessage('photos.invalid'); return; }
    locked.current = true; setBusy(true); setMessage('');
    const form = new FormData(); form.append('file', file);
    try {
      const { data } = await api.post(`/activities/${activityId}/photo`, form, { headers: { 'Content-Type': undefined }, quietForbidden: true });
      if (!data?.id) throw Error();
      setDocumentId(data.id);
    } catch { setMessage('photos.uploadError'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <div className="mt-2 space-y-2 whitespace-normal max-w-xs">
    {canUpload && <label htmlFor={inputId} className="block text-xs">{t('photos.upload')}<input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={upload} className="block w-full text-xs mt-1" /></label>}
    {busy && <p role="status" className="text-xs">{t('common.loading')}</p>}
    {documentId && <p className="text-xs">{t('photos.id', { id: documentId })}</p>}
    {message && <p role="status" className="text-xs text-muted-foreground">{t(message)}</p>}
    {url && <button type="button" onClick={() => setExpanded(true)} aria-label={t('photos.expand')}><img src={url} alt={t('photos.alt')} className="h-20 w-28 rounded object-cover" onError={() => { setUrl(null); setMessage('photos.unavailable'); }} /></button>}
    <details className="text-xs"><summary className="cursor-pointer">{t('photos.open')}</summary><p className="my-2 text-muted-foreground">{t('photos.lookupHelp')}</p><form onSubmit={e => { e.preventDefault(); setDocumentId(enteredId); setLoadVersion(v => v + 1); }} className="space-y-2"><label>{t('photos.documentId')}<input type="number" min="1" step="1" required value={enteredId} onChange={e => setEnteredId(e.target.value)} className="block w-full rounded border bg-background p-1" /></label><Button type="submit" size="sm" variant="outline">{t('photos.view')}</Button></form></details>
    <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{t('photos.alt')}</DialogTitle><DialogDescription>{t('photos.id', { id: documentId })}</DialogDescription></DialogHeader>{url && <img src={url} alt={t('photos.alt')} className="max-h-[70vh] w-full object-contain" />}</DialogContent></Dialog>
  </div>;
}
