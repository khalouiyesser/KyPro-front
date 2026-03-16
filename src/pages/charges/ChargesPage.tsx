import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chargesApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useI18n } from '../../context/I18nContext';
import {
  Plus, Pencil, Trash2, X, Sparkles, Upload, Eye,
  FileText, Image as ImageIcon, Link, Calendar,
  Loader2, File, Download, ZoomIn, ExternalLink,
  PlusCircle, MinusCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────
type OcrMode  = 'url' | 'upload';
type FormMode = 'manual' | 'ocr';

interface OcrItem { label: string; total: number; }

// ── FormState inclut currency et isDevis ──────────────────────────────────────
interface FormState {
  description: string;
  amount:      number;
  amountHT:    number;
  tva:         number;
  date:        string;
  type:        string;
  source:      string;
  notes:       string;
  imageUrl:    string;
  currency:    string;   // ← NEW
  isDevis:     boolean;  // ← NEW
}

const CHARGE_TYPES = [
  'rent','salary','utilities','equipment',
  'marketing','tax','insurance','accounting','fuel','other',
] as const;

const CURRENCIES = ['TND','EUR','USD','other'] as const;

const ACCEPTED_MIME_TYPES = ['image/jpeg','image/png','image/webp','image/gif','application/pdf'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.pdf';
const MAX_FILE_SIZE_MB     = 10;

// ── Formate un montant selon la devise ────────────────────────────────────────
const formatAmount = (v: number, currency = 'TND') => {
  if (v === null || v === undefined) return '—';
  switch (currency) {
    case 'EUR':   return `${(v).toFixed(2)} €`;
    case 'USD':   return `$${(v).toFixed(2)}`;
    default:      return `${(v).toFixed(3)} TND`;
  }
};

const defaultForm: FormState = {
  description: '', amount: 0, amountHT: 0, tva: 0,
  date:        new Date().toISOString().split('T')[0],
  type:        'other', source: '', notes: '', imageUrl: '',
  currency:    'TND',   // ← NEW
  isDevis:     false,   // ← NEW
};

// ─── Type badge colors ────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  rent:       'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  salary:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  utilities:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  equipment:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  marketing:  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  tax:        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  insurance:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  accounting: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  fuel:       'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  other:      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

// ─── Devise badge ─────────────────────────────────────────────────────────────
const CurrencyBadge: React.FC<{ currency?: string }> = ({ currency }) => {
  if (!currency || currency === 'TND') return null;
  const colors: Record<string, string> = {
    EUR:   'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
    USD:   'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300',
    other: 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${colors[currency] || colors.other}`}>
      {currency}
    </span>
  );
};

// ─── PDF Preview ──────────────────────────────────────────────────────────────
const PdfPreview: React.FC<{ fileName?: string }> = ({ fileName }) => (
    <div className="flex flex-col items-center justify-center gap-2 py-4">
      <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
        <File size={28} className="text-red-500" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[180px] truncate text-center">
        {fileName || 'document.pdf'}
      </p>
      <span className="text-xs text-red-500 font-semibold uppercase tracking-wide">PDF</span>
    </div>
);

// ─── Items table (read-only) ──────────────────────────────────────────────────
const ItemsTable: React.FC<{ items: OcrItem[]; currency?: string }> = ({ items, currency = 'TND' }) => {
  if (!items || items.length === 0) return null;
  const total = items.reduce((s, i) => s + (i.total || 0), 0);
  return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Détail des lignes
          </p>
          <CurrencyBadge currency={currency} />
        </div>
        <table className="w-full text-sm">
          <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700">
            <th className="text-left px-3 py-2 text-xs text-gray-400 font-medium">Désignation</th>
            <th className="text-right px-3 py-2 text-xs text-gray-400 font-medium">Total</th>
          </tr>
          </thead>
          <tbody>
          {items.map((item, i) => (
              <tr
                  key={i}
                  className={`border-b border-gray-50 dark:border-gray-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'}`}
              >
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.label}</td>
                <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {formatAmount(item.total, currency)}
                </td>
              </tr>
          ))}
          </tbody>
          {items.length > 1 && (
              <tfoot>
              <tr className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                <td className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Total</td>
                <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  {formatAmount(total, currency)}
                </td>
              </tr>
              </tfoot>
          )}
        </table>
      </div>
  );
};

// ─── Items editor ─────────────────────────────────────────────────────────────
const ItemsEditor: React.FC<{
  items:     OcrItem[];
  currency?: string;
  onChange:  (items: OcrItem[]) => void;
}> = ({ items, currency = 'TND', onChange }) => {

  const addItem    = () => onChange([...items, { label: '', total: 0 }]);
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof OcrItem, value: string | number) =>
      onChange(items.map((it, i) => i === idx ? { ...it, [field]: value } : it));

  const cellInp = 'px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors w-full';

  return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Lignes de facturation
            </p>
            <CurrencyBadge currency={currency} />
          </div>
          <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors"
          >
            <PlusCircle size={13} /> Ajouter une ligne
          </button>
        </div>

        {items.length === 0 ? (
            <div
                onClick={addItem}
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl py-3 flex items-center justify-center gap-2 text-xs text-gray-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors"
            >
              <PlusCircle size={14} /> Cliquer pour ajouter des lignes
            </div>
        ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_120px_32px] gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-400 font-medium">Désignation</span>
                <span className="text-xs text-gray-400 font-medium text-right">Total ({currency})</span>
                <span />
              </div>

              {/* Rows */}
              {items.map((item, i) => (
                  <div
                      key={i}
                      className={`grid grid-cols-[1fr_120px_32px] gap-2 px-3 py-2 items-center border-b border-gray-50 dark:border-gray-800 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/40 dark:bg-gray-800/20' : ''}`}
                  >
                    <input
                        type="text"
                        value={item.label}
                        onChange={e => updateItem(i, 'label', e.target.value)}
                        placeholder="Désignation…"
                        className={cellInp}
                    />
                    <input
                        type="number"
                        min={0}
                        step={0.001}
                        value={item.total}
                        onChange={e => updateItem(i, 'total', parseFloat(e.target.value) || 0)}
                        className={`${cellInp} text-right`}
                    />
                    <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                    >
                      <MinusCircle size={15} />
                    </button>
                  </div>
              ))}

              {/* Footer total */}
              {items.length > 1 && (
                  <div className="grid grid-cols-[1fr_120px_32px] gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-600">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-right">
                {formatAmount(items.reduce((s, it) => s + (it.total || 0), 0), currency)}
              </span>
                    <span />
                  </div>
              )}
            </div>
        )}
      </div>
  );
};

// ─── Image Viewer Modal ───────────────────────────────────────────────────────
const ImageViewer: React.FC<{
  src:       string;
  fileName?: string;
  onClose:   () => void;
}> = ({ src, fileName, onClose }) => {
  const [zoomed, setZoomed] = useState(false);

  const handleDownload = async () => {
    try {
      if (src.startsWith('data:')) {
        const a    = document.createElement('a');
        a.href     = src;
        a.download = fileName || 'facture';
        a.click();
      } else {
        const res  = await fetch(src);
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = fileName || src.split('/').pop() || 'facture';
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success('Téléchargement lancé');
    } catch {
      window.open(src, '_blank');
      toast.error('Téléchargement direct impossible — ouverture dans un nouvel onglet');
    }
  };

  return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 flex flex-col bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[92vh]">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <ImageIcon size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-300 truncate">{fileName || 'Facture'}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                  onClick={() => setZoomed(z => !z)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${zoomed ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                <ZoomIn size={13} /> {zoomed ? 'Dézoomer' : 'Zoom'}
              </button>
              {!src.startsWith('data:') && (
                  <a
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    <ExternalLink size={13} /> Ouvrir
                  </a>
              )}
              <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Download size={13} /> Télécharger
              </button>
              <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Image */}
          <div
              className={`overflow-auto flex-1 flex items-center justify-center bg-gray-950 ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={() => setZoomed(z => !z)}
          >
            <img
                src={src}
                alt="Facture"
                className={`transition-all duration-300 select-none ${zoomed ? 'max-w-none w-auto h-auto' : 'max-w-full max-h-[75vh] object-contain'}`}
                draggable={false}
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex-shrink-0">
            <p className="text-xs text-gray-500 text-center">
              Cliquer sur l'image pour {zoomed ? 'dézoomer' : 'zoomer'} · Échap pour fermer
            </p>
          </div>
        </div>
      </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ChargesPage: React.FC = () => {
  const { t, dir }    = useI18n();
  const queryClient   = useQueryClient();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
  const fileInputRef  = useRef<HTMLInputElement>(null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [showForm, setShowForm]         = useState(false);
  const [formMode, setFormMode]         = useState<FormMode>('manual');
  const [ocrMode, setOcrMode]           = useState<OcrMode>('upload');
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [detailCharge, setDetailCharge] = useState<any>(null);

  // ── Form state ────────────────────────────────────────────────────────────────
  const [form, setForm]           = useState<FormState>(defaultForm);
  const [formItems, setFormItems] = useState<OcrItem[]>([]);

  // ── OCR state ─────────────────────────────────────────────────────────────────
  const [ocrUrl, setOcrUrl]         = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrItems, setOcrItems]     = useState<OcrItem[]>([]);

  // ── Upload state ──────────────────────────────────────────────────────────────
  const [imagePreview, setImagePreview]     = useState('');
  const [pdfFileName, setPdfFileName]       = useState('');
  const [uploadedBase64, setUploadedBase64] = useState('');
  const [uploadedMime, setUploadedMime]     = useState('');
  const [dragOver, setDragOver]             = useState(false);

  // ── Viewer state ──────────────────────────────────────────────────────────────
  const [viewerSrc, setViewerSrc]   = useState('');
  const [viewerName, setViewerName] = useState('');
  const [showViewer, setShowViewer] = useState(false);

  // Fermer la visionneuse avec Échap
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowViewer(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getImageSrc = (imageUrl: string): string => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('data:')) return imageUrl;
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/') && imageUrl.length > 100)
      return `data:image/jpeg;base64,${imageUrl}`;
    return imageUrl;
  };

  const isPdf = (url: string) =>
      url.toLowerCase().endsWith('.pdf') || url.startsWith('data:application/pdf');

  const openViewer = (src: string, name?: string) => {
    setViewerSrc(getImageSrc(src));
    setViewerName(name || 'Facture');
    setShowViewer(true);
  };

  // ── Queries ───────────────────────────────────────────────────────────────────
  const { data: charges = [], isLoading } = useQuery({
    queryKey: ['charges'],
    queryFn:  () => chargesApi.getAll(),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: chargesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      toast.success(t('charges.created'));
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => chargesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      toast.success(t('charges.updated'));
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: chargesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      toast.success(t('charges.deleted'));
    },
  });

  // ── Form helpers ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
    setFormItems([]);
    setOcrUrl('');
    setImagePreview('');
    setPdfFileName('');
    setUploadedBase64('');
    setUploadedMime('');
    setOcrItems([]);
    setFormMode('manual');
  };

  const clearUpload = () => {
    setImagePreview('');
    setPdfFileName('');
    setUploadedBase64('');
    setUploadedMime('');
    setForm(f => ({ ...f, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── openEdit : récupère currency + isDevis depuis la charge existante ─────────
  const openEdit = (c: any) => {
    setEditingId(c._id);
    setForm({
      description: c.description || '',
      amount:      c.amount      || 0,
      amountHT:    c.amountHT    || 0,
      tva:         c.tva         || 0,
      date:        c.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      type:        c.type        || 'other',
      source:      c.source      || '',
      notes:       c.notes       || '',
      imageUrl:    c.imageUrl    || '',
      currency:    c.currency    || 'TND',  // ← NEW
      isDevis:     c.isDevis     ?? false,   // ← NEW
    });
    setFormItems(c.items || []);
    if (c.imageUrl) setImagePreview(c.imageUrl);
    setFormMode('manual');
    setShowForm(true);
  };

  const handleDelete = (c: any) => confirm(
      {
        title:         `${t('charges.deleteTitle')} "${c.description}"`,
        message:       `${t('charges.deleteMsg')} ${formatAmount(c.amount, c.currency)}`,
        dangerMessage: t('charges.deleteDanger'),
        confirmLabel:  t('charges.deleteConfirm'),
      },
      () => deleteMut.mutate(c._id),
  );

  // ── File handling ─────────────────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast.error(`${t('charges.invalidFile')} (JPG, PNG, WEBP, GIF, PDF)`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`${t('charges.fileTooLarge')} (max ${MAX_FILE_SIZE_MB} MB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl     = e.target?.result as string;
      const [meta, b64] = dataUrl.split(',');
      const mime        = meta.match(/data:([^;]+)/)?.[1] || file.type;
      setUploadedBase64(b64);
      setUploadedMime(mime);
      if (mime === 'application/pdf') {
        setImagePreview('');
        setPdfFileName(file.name);
        setForm(f => ({ ...f, imageUrl: '' }));
      } else {
        setImagePreview(dataUrl);
        setPdfFileName('');
        setForm(f => ({ ...f, imageUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const hasUploadedFile = imagePreview.startsWith('data:') || pdfFileName !== '';

  // ── OCR : currency et isDevis stockés dans form (plus ocrCurrency) ────────────
  const applyOcrSuggestion = (s: any, urlSource?: string) => {
    if (!s) return;
    setForm(f => ({
      ...f,
      description: s.description || f.description,
      amount:      s.amount      ?? f.amount,
      amountHT:    s.amountHT    ?? f.amountHT,
      tva:         s.tva         ?? f.tva,
      date:        s.date        || f.date,
      type:        s.type        || f.type,
      source:      s.source      || f.source,
      currency:    s.currency    || f.currency,  // ← NEW : dans form
      isDevis:     s.isDevis     ?? f.isDevis,    // ← NEW
      ...(urlSource ? { imageUrl: urlSource } : {}),
    }));
    if (s.items?.length) {
      setOcrItems(s.items);
      setFormItems(s.items);
    }
    setFormMode('manual');
    toast.success(t('charges.ocrSuccess'));
  };

  const runOcrFromUrl = async () => {
    if (!ocrUrl.trim()) { toast.error(t('charges.enterUrl')); return; }
    setOcrLoading(true);
    try {
      const res = await api.post('/charges/ocr/url', { imageUrl: ocrUrl });
      applyOcrSuggestion(res.data?.suggestion, ocrUrl);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('charges.ocrFailed'));
    } finally {
      setOcrLoading(false);
    }
  };

  const runOcrFromUpload = async () => {
    if (!uploadedBase64 || !uploadedMime) { toast.error(t('charges.uploadFirst')); return; }
    setOcrLoading(true);
    try {
      const res = await api.post('/charges/ocr/upload', { base64: uploadedBase64, mimeType: uploadedMime });
      applyOcrSuggestion(res.data?.suggestion);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('charges.ocrFailed'));
    } finally {
      setOcrLoading(false);
    }
  };

  // ── Submit : payload inclut currency, isDevis, items ──────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = formItems.filter(it => it.label.trim() && it.total >= 0);
    const payload    = { ...form, items: validItems };
    if (editingId) updateMut.mutate({ id: editingId, data: payload });
    else           createMut.mutate(payload as any);
  };

  // ── Styles ────────────────────────────────────────────────────────────────────
  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';

  // ── Drop zone ─────────────────────────────────────────────────────────────────
  const renderDropZoneContent = () => {
    if (pdfFileName) return <PdfPreview fileName={pdfFileName} />;
    if (imagePreview) return (
        <img src={imagePreview} alt="preview" className="mx-auto max-h-32 rounded-lg object-contain" />
    );
    return (
        <div className="flex flex-col items-center gap-2">
          <Upload size={24} className="text-gray-400" />
          <p className="text-sm text-gray-500">{t('charges.dropHere')}</p>
          <p className="text-xs text-gray-400">
            JPG, PNG, WEBP, GIF, <span className="font-semibold text-red-400">PDF</span> — max {MAX_FILE_SIZE_MB} MB
          </p>
        </div>
    );
  };

  // ── Table columns — montant affiché avec la devise de la charge ───────────────
  const columns = [
    {
      key: 'description', header: t('charges.description'), sortable: true,
      render: (v: string, row: any) => (
          <div className="flex items-center gap-2">
            {row.imageUrl && (
                <button
                    onClick={e => { e.stopPropagation(); if (!isPdf(row.imageUrl)) openViewer(row.imageUrl, row.description); }}
                    className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all group relative"
                    title="Voir la facture"
                >
                  {isPdf(row.imageUrl) ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-50">
                        <File size={14} className="text-red-400" />
                      </div>
                  ) : (
                      <>
                        <img
                            src={getImageSrc(row.imageUrl)}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn size={12} className="text-white" />
                        </div>
                      </>
                  )}
                </button>
            )}
            <div className="min-w-0">
              <span className="font-medium text-gray-900 dark:text-white truncate max-w-[160px] block">{v}</span>
              {row.isDevis && (
                  <span className="text-xs text-amber-500 font-medium">Devis</span>
              )}
            </div>
          </div>
      ),
    },
    {
      key: 'type', header: t('common.type'), sortable: true,
      render: (v: string) => (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[v] || TYPE_COLORS.other}`}>
          {t(`charges.type.${v}`)}
        </span>
      ),
    },
    {
      // Montant affiché dans la bonne devise
      key: 'amount', header: t('charges.amountTTC'), sortable: true,
      render: (v: number, row: any) => (
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{formatAmount(v, row.currency)}</span>
            <CurrencyBadge currency={row.currency} />
          </div>
      ),
    },
    { key: 'tva',    header: t('charges.tva'),       render: (v: number) => v ? `${v}%` : '—', sortable: false },
    { key: 'source', header: t('charges.reference'), render: (v: string) => v || '—' },
    {
      key: 'date', header: t('common.date'), sortable: true,
      render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '—',
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
      <div className="space-y-6" dir={dir}>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('charges.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {(charges as any[]).length} {t('charges.count')}
            </p>
          </div>
          <button
              onClick={() => {
                setEditingId(null);
                setForm(defaultForm);
                setFormItems([]);
                clearUpload();
                setOcrItems([]);
                setFormMode('manual');
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors self-start sm:self-auto"
          >
            <Plus size={16} /> {t('charges.new')}
          </button>
        </div>

        {/* ── Table ── */}
        <DataTable
            data={charges as any[]}
            columns={columns}
            searchKeys={['description','type','source']}
            isLoading={isLoading}
            emptyMessage={t('charges.empty')}
            actions={(row) => (
                <div className="flex items-center justify-end gap-1">
                  <button
                      onClick={() => setDetailCharge(row)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={t('common.view')}
                  >
                    <Eye size={15} />
                  </button>
                  <button
                      onClick={() => openEdit(row)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title={t('common.edit')}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                      onClick={() => handleDelete(row)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title={t('common.delete')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
            )}
        />

        {/* ══════════════════════════════════════════════════════════════════════
          Image Viewer
      ══════════════════════════════════════════════════════════════════════ */}
        {showViewer && viewerSrc && (
            <ImageViewer
                src={viewerSrc}
                fileName={viewerName}
                onClose={() => setShowViewer(false)}
            />
        )}

        {/* ══════════════════════════════════════════════════════════════════════
          Detail Modal
      ══════════════════════════════════════════════════════════════════════ */}
        {detailCharge && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailCharge(null)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>

                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 z-10">
                  <button
                      onClick={() => setDetailCharge(null)}
                      className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                  <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex-shrink-0">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {detailCharge.description}
                        </h2>
                        {detailCharge.isDevis && (
                            <span className="text-xs bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        Devis
                      </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[detailCharge.type] || TYPE_COLORS.other}`}>
                      {t(`charges.type.${detailCharge.type}`)}
                    </span>
                        <CurrencyBadge currency={detailCharge.currency} />
                        {detailCharge.date && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} /> {format(new Date(detailCharge.date), 'dd/MM/yyyy')}
                      </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 space-y-4">

                  {/* ── Image ── */}
                  {detailCharge.imageUrl && !isPdf(detailCharge.imageUrl) && (
                      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div
                            className="relative cursor-zoom-in group"
                            onClick={() => openViewer(detailCharge.imageUrl, detailCharge.description)}
                        >
                          <img
                              src={getImageSrc(detailCharge.imageUrl)}
                              alt={t('charges.receipt')}
                              className="w-full max-h-64 object-contain"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                if (!img.src.startsWith('data:') && detailCharge.imageUrl.length > 100)
                                  img.src = `data:image/jpeg;base64,${detailCharge.imageUrl}`;
                                else (img.parentElement as HTMLElement).style.display = 'none';
                              }}
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/90 rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-medium text-gray-800">
                              <ZoomIn size={14} /> Agrandir
                            </div>
                          </div>
                        </div>
                        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                          <ImageIcon size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500 truncate flex-1">{t('charges.receipt')}</span>
                          <button
                              onClick={() => openViewer(detailCharge.imageUrl, detailCharge.description)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            <ZoomIn size={11} /> Voir
                          </button>
                          {!detailCharge.imageUrl.startsWith('data:') && detailCharge.imageUrl.startsWith('http') && (
                              <a
                                  href={detailCharge.imageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors"
                              >
                                <ExternalLink size={11} /> Ouvrir
                              </a>
                          )}
                          <button
                              onClick={() => openViewer(detailCharge.imageUrl, detailCharge.description)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors"
                              title="Télécharger via la visionneuse"
                          >
                            <Download size={11} /> DL
                          </button>
                        </div>
                      </div>
                  )}

                  {/* ── PDF ── */}
                  {detailCharge.imageUrl && isPdf(detailCharge.imageUrl) && (
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                            <File size={18} className="text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Document PDF</p>
                            <p className="text-xs text-gray-400">Facture attachée</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {detailCharge.imageUrl.startsWith('http') && (
                              <a
                                  href={detailCharge.imageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg text-xs font-medium transition-colors"
                              >
                                <ExternalLink size={12} /> Ouvrir
                              </a>
                          )}
                          <a
                              href={detailCharge.imageUrl}
                              download
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Download size={12} /> Télécharger
                          </a>
                        </div>
                      </div>
                  )}

                  {/* ── Montants — devise correcte ── */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">{t('charges.amountHT')}</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {formatAmount(detailCharge.amountHT || detailCharge.amount, detailCharge.currency)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">{t('charges.amountTTC')}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatAmount(
                            detailCharge.amount +
                            (detailCharge.tva
                                ? (detailCharge.amountHT || detailCharge.amount) * detailCharge.tva / 100
                                : 0),
                            detailCharge.currency,
                        )}
                      </p>
                    </div>
                  </div>

                  {/* ── Items — devise correcte ── */}
                  {detailCharge.items?.length > 0 && (
                      <ItemsTable items={detailCharge.items} currency={detailCharge.currency} />
                  )}

                  {/* ── Métadonnées ── */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {detailCharge.tva > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">{t('charges.tva')}</p>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{detailCharge.tva}%</p>
                        </div>
                    )}
                    {detailCharge.source && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">{t('charges.reference')}</p>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{detailCharge.source}</p>
                        </div>
                    )}
                    {detailCharge.createdByName && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">{t('charges.createdBy')}</p>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{detailCharge.createdByName}</p>
                        </div>
                    )}
                    {detailCharge.createdAt && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">{t('charges.createdAt')}</p>
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {format(new Date(detailCharge.createdAt), 'dd/MM/yyyy')}
                          </p>
                        </div>
                    )}
                  </div>

                  {detailCharge.notes && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-xl p-3 text-xs text-yellow-800 dark:text-yellow-200">
                        <span className="font-semibold">{t('common.notes')} : </span>{detailCharge.notes}
                      </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                        onClick={() => { setDetailCharge(null); openEdit(detailCharge); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      <Pencil size={14} /> {t('common.edit')}
                    </button>
                    <button
                        onClick={() => { setDetailCharge(null); handleDelete(detailCharge); }}
                        className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-sm font-medium transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
          Form Modal
      ══════════════════════════════════════════════════════════════════════ */}
        {showForm && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={resetForm} />
              <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" dir={dir}>

                {/* Modal header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-t-2xl px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 z-10">
                  <button onClick={resetForm} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                    <X size={18} />
                  </button>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {editingId ? t('charges.editTitle') : t('charges.newTitle')}
                  </h2>
                  {!editingId && (
                      <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => setFormMode('manual')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${formMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                          <FileText size={12} /> {t('charges.modeManual')}
                        </button>
                        <button
                            onClick={() => setFormMode('ocr')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${formMode === 'ocr' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                          <Sparkles size={12} /> {t('charges.modeOcr')}
                        </button>
                      </div>
                  )}
                </div>

                <div className="px-5 py-4">

                  {/* ── OCR Panel ── */}
                  {formMode === 'ocr' && !editingId && (
                      <div className="mb-4 space-y-3">
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-xl p-3 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
                          <Sparkles size={14} className="flex-shrink-0 mt-0.5" />
                          <span>{t('charges.ocrHint')}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                              onClick={() => setOcrMode('upload')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors border ${ocrMode === 'upload' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                          >
                            <Upload size={12} /> {t('charges.uploadFile')}
                          </button>
                          <button
                              onClick={() => setOcrMode('url')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors border ${ocrMode === 'url' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                          >
                            <Link size={12} /> {t('charges.imageUrl')}
                          </button>
                        </div>

                        {ocrMode === 'upload' && (
                            <div>
                              <div
                                  onClick={() => fileInputRef.current?.click()}
                                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                  onDragLeave={() => setDragOver(false)}
                                  onDrop={handleDrop}
                                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all relative ${dragOver ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : hasUploadedFile ? 'border-purple-300 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/10' : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'}`}
                              >
                                {hasUploadedFile && (
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); clearUpload(); }}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 hover:bg-red-600"
                                    >✕</button>
                                )}
                                {renderDropZoneContent()}
                              </div>
                              <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} className="hidden" onChange={handleFileChange} />
                              {uploadedMime && (
                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    {uploadedMime === 'application/pdf'
                                        ? <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full font-medium"><File size={10} /> PDF détecté</span>
                                        : <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full font-medium"><ImageIcon size={10} /> Image détectée</span>
                                    }
                                  </div>
                              )}
                              {hasUploadedFile && (
                                  <button
                                      onClick={runOcrFromUpload}
                                      disabled={ocrLoading}
                                      className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-sm font-medium transition-colors"
                                  >
                                    {ocrLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    {ocrLoading ? t('charges.ocrRunning') : t('charges.extractWithOcr')}
                                  </button>
                              )}
                            </div>
                        )}

                        {ocrMode === 'url' && (
                            <div className="space-y-2">
                              <input
                                  value={ocrUrl}
                                  onChange={e => setOcrUrl(e.target.value)}
                                  placeholder="https://example.com/facture.pdf"
                                  className={inp}
                              />
                              {ocrUrl && !ocrUrl.toLowerCase().endsWith('.pdf') && (
                                  <img src={ocrUrl} alt="preview" className="w-full max-h-40 object-contain rounded-xl border border-gray-200 dark:border-gray-700" onError={() => {}} />
                              )}
                              {ocrUrl && ocrUrl.toLowerCase().endsWith('.pdf') && (
                                  <div className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                                    <File size={16} className="text-red-400" /> PDF depuis URL
                                  </div>
                              )}
                              <button
                                  onClick={runOcrFromUrl}
                                  disabled={ocrLoading || !ocrUrl.trim()}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-sm font-medium transition-colors"
                              >
                                {ocrLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                {ocrLoading ? t('charges.ocrRunning') : t('charges.extractWithOcr')}
                              </button>
                            </div>
                        )}

                        {/* OCR items preview — utilise form.currency ── */}
                        {ocrItems.length > 0 && (
                            <div className="mt-2">
                              <ItemsTable items={ocrItems} currency={form.currency} />
                            </div>
                        )}

                        {/* Devise détectée par l'OCR */}
                        {form.currency && form.currency !== 'TND' && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                              <span className="text-xs text-blue-600 dark:text-blue-400">Devise détectée :</span>
                              <CurrencyBadge currency={form.currency} />
                            </div>
                        )}

                        <div className="flex items-center gap-3 mt-4">
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                          <span className="text-xs text-gray-400">{t('charges.orFillManually')}</span>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        </div>
                      </div>
                  )}

                  {/* ── Manual Form ── */}
                  <form onSubmit={handleSubmit} className="space-y-3">

                    {/* Receipt upload (manual mode only) */}
                    {formMode === 'manual' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                            {t('charges.receipt')}
                          </label>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <div
                                  onClick={() => fileInputRef.current?.click()}
                                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                  onDragLeave={() => setDragOver(false)}
                                  onDrop={handleDrop}
                                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all relative ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'}`}
                              >
                                {imagePreview ? (
                                    <div className="relative inline-block group">
                                      <img src={imagePreview} alt="preview" className="max-h-28 rounded-lg object-contain mx-auto" />
                                      <div
                                          className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2"
                                          onClick={e => { e.stopPropagation(); openViewer(imagePreview, form.description || 'Facture'); }}
                                      >
                                        <ZoomIn size={18} className="text-white" />
                                      </div>
                                      <button
                                          type="button"
                                          onClick={e => { e.stopPropagation(); clearUpload(); }}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                      >✕</button>
                                    </div>
                                ) : pdfFileName ? (
                                    <div className="relative">
                                      <PdfPreview fileName={pdfFileName} />
                                      <button
                                          type="button"
                                          onClick={e => { e.stopPropagation(); clearUpload(); }}
                                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                      >✕</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 py-2">
                                      <Upload size={20} className="text-gray-400" />
                                      <p className="text-xs text-gray-500">{t('charges.dropOrClick')}</p>
                                      <p className="text-xs text-gray-400">JPG, PNG, PDF…</p>
                                    </div>
                                )}
                              </div>
                              <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept={ACCEPTED_EXTENSIONS}
                                  className="hidden"
                                  onChange={handleFileChange}
                              />
                              {imagePreview && (
                                  <button
                                      type="button"
                                      onClick={() => openViewer(imagePreview, form.description || 'Facture')}
                                      className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  >
                                    <ZoomIn size={12} /> Voir en plein écran
                                  </button>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 justify-start">
                              <p className="text-xs text-gray-400 mt-1">{t('charges.orUrl')}</p>
                              <input
                                  value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                                  onChange={e => {
                                    setForm((f: FormState) => ({ ...f, imageUrl: e.target.value }));
                                    setImagePreview(e.target.value);
                                  }}
                                  placeholder="https://..."
                                  className="w-48 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                    )}

                    {/* Fields grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {t('charges.description')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            value={form.description}
                            onChange={e => setForm((f: FormState) => ({ ...f, description: e.target.value }))}
                            className={inp}
                        />
                      </div>
                      <div>
                        {/* Label dynamique selon la devise */}
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Montant TTC
                          {form.currency !== 'TND' && (
                              <span className="ml-1 font-semibold text-blue-500">({form.currency})</span>
                          )}
                          <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                            required
                            type="number"
                            min={0}
                            step={0.001}
                            value={form.amount}
                            onChange={e => setForm((f: FormState) => ({ ...f, amount: +e.target.value }))}
                            className={inp}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {t('charges.tva')} (%)
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={form.tva}
                            onChange={e => setForm((f: FormState) => ({ ...f, tva: +e.target.value }))}
                            className={inp}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {t('common.date')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="date"
                            value={form.date}
                            onChange={e => setForm((f: FormState) => ({ ...f, date: e.target.value }))}
                            className={inp}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {t('common.type')}
                        </label>
                        <select
                            value={form.type}
                            onChange={e => setForm((f: FormState) => ({ ...f, type: e.target.value }))}
                            className={inp}
                        >
                          {CHARGE_TYPES.map(ct => (
                              <option key={ct} value={ct}>{t(`charges.type.${ct}`)}</option>
                          ))}
                        </select>
                      </div>

                      {/* ── Devise — sélectable manuellement ── */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Devise
                        </label>
                        <select
                            value={form.currency}
                            onChange={e => setForm((f: FormState) => ({ ...f, currency: e.target.value }))}
                            className={inp}
                        >
                          {CURRENCIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {t('charges.reference')}
                        </label>
                        <input
                            value={form.source}
                            onChange={e => setForm((f: FormState) => ({ ...f, source: e.target.value }))}
                            className={inp}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {t('common.notes')}
                        </label>
                        <input
                            value={form.notes}
                            onChange={e => setForm((f: FormState) => ({ ...f, notes: e.target.value }))}
                            className={inp}
                        />
                      </div>
                    </div>

                    {/* TTC preview — devise correcte ── */}
                    {form.tva > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm">
                          <span className="text-gray-500">{t('charges.amountTTC')}</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                      {formatAmount(form.amount * (1 + form.tva / 100), form.currency)}
                    </span>
                        </div>
                    )}

                    {/* ── Items editor — form.currency ── */}
                    <div className="pt-1">
                      <ItemsEditor
                          items={formItems}
                          currency={form.currency}
                          onChange={setFormItems}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                      <button
                          type="button"
                          onClick={resetForm}
                          className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                          type="submit"
                          disabled={createMut.isPending || updateMut.isPending}
                          className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        {createMut.isPending || updateMut.isPending
                            ? t('common.loading')
                            : editingId ? t('common.save') : t('charges.addCharge')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
        )}

        <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} />
      </div>
  );
};

export default ChargesPage;