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
  Tag, DollarSign, Hash, StickyNote, ChevronRight,
  CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from "../../api/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type OcrMode = 'url' | 'upload';
type FormMode = 'manual' | 'ocr';

const CHARGE_TYPES = [
  'rent','salary','utilities','equipment',
  'marketing','tax','insurance','accounting','fuel','other',
] as const;

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const defaultForm = {
  description: '', amount: 0, amountHT: 0, tva: 0,
  date: new Date().toISOString().split('T')[0],
  type: 'other', source: '', notes: '', imageUrl: '',
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

// ─── Component ────────────────────────────────────────────────────────────────
const ChargesPage: React.FC = () => {
  const { t, dir } = useI18n();
  const queryClient = useQueryClient();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [showForm, setShowForm]         = useState(false);
  const [formMode, setFormMode]         = useState<FormMode>('manual');
  const [ocrMode, setOcrMode]           = useState<OcrMode>('upload');
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [detailCharge, setDetailCharge] = useState<any>(null);
  const [form, setForm]                 = useState(defaultForm);
  const [ocrUrl, setOcrUrl]             = useState('');
  const [ocrLoading, setOcrLoading]     = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [dragOver, setDragOver]         = useState(false);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: charges = [], isLoading } = useQuery({
    queryKey: ['charges'],
    queryFn: () => chargesApi.getAll(),
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: chargesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      toast.success(t('charges.created'));
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => chargesApi.update(id, data),
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

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
    setOcrUrl('');
    setImagePreview('');
    setFormMode('manual');
  };

  const openEdit = (c: any) => {
    setEditingId(c._id);
    setForm({
      description: c.description || '',
      amount: c.amount || 0,
      amountHT: c.amountHT || 0,
      tva: c.tva || 0,
      date: c.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      type: c.type || 'other',
      source: c.source || '',
      notes: c.notes || '',
      imageUrl: c.imageUrl || '',
    });
    if (c.imageUrl) setImagePreview(c.imageUrl);
    setFormMode('manual');
    setShowForm(true);
  };

  const handleDelete = (c: any) => confirm(
      {
        title: `${t('charges.deleteTitle')} "${c.description}"`,
        message: `${t('charges.deleteMsg')} ${formatTND(c.amount)}`,
        dangerMessage: t('charges.deleteDanger'),
        confirmLabel: t('charges.deleteConfirm'),
      },
      () => deleteMut.mutate(c._id),
  );

  // ── Image handling ───────────────────────────────────────────────────────────
  const processImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('charges.invalidFile'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('charges.fileTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setForm(f => ({ ...f, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  // ── OCR ─────────────────────────────────────────────────────────────────────
  const runOcrFromUrl = async () => {
    if (!ocrUrl.trim()) { toast.error(t('charges.enterUrl')); return; }
    setOcrLoading(true);
    try {
      const res = await api.post('/charges/ocr/url', { imageUrl: ocrUrl });
      const s = res.data?.suggestion;
      if (s) {
        setForm(f => ({
          ...f,
          description: s.description || f.description,
          amount:      s.amount      ?? f.amount,
          amountHT:    s.amountHT    ?? f.amountHT,
          tva:         s.tva         ?? f.tva,
          date:        s.date        || f.date,
          type:        s.type        || f.type,
          source:      s.source      || f.source,
          imageUrl:    ocrUrl,
        }));
        setImagePreview(ocrUrl);
        setFormMode('manual');
        toast.success(t('charges.ocrSuccess'));
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('charges.ocrFailed'));
    } finally {
      setOcrLoading(false);
    }
  };

  const runOcrFromUpload = async () => {
    if (!imagePreview || !imagePreview.startsWith('data:')) {
      toast.error(t('charges.uploadFirst'));
      return;
    }
    setOcrLoading(true);
    try {
      const [meta, base64] = imagePreview.split(',');
      const mimeType = meta.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
      const res = await api.post('/charges/ocr/upload', { base64, mimeType });
      const s = res.data?.suggestion;
      if (s) {
        setForm(f => ({
          ...f,
          description: s.description || f.description,
          amount:      s.amount      ?? f.amount,
          amountHT:    s.amountHT    ?? f.amountHT,
          tva:         s.tva         ?? f.tva,
          date:        s.date        || f.date,
          type:        s.type        || f.type,
          source:      s.source      || f.source,
        }));
        setFormMode('manual');
        toast.success(t('charges.ocrSuccess'));
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('charges.ocrFailed'));
    } finally {
      setOcrLoading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (editingId) updateMut.mutate({ id: editingId, data: payload });
    else createMut.mutate(payload as any);
  };

  // ── Shared input class ────────────────────────────────────────────────────
  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'description', header: t('charges.description'), sortable: true,
      render: (v: string, row: any) => (
          <div className="flex items-center gap-2">
            {row.imageUrl && (
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
                  <img src={row.imageUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
            )}
            <span className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{v}</span>
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
    { key: 'amount', header: t('charges.amountHT'), render: formatTND, sortable: true },
    { key: 'tva',    header: t('charges.tva'),      render: (v: number) => v ? `${v}%` : '—', sortable: false },
    { key: 'source', header: t('charges.reference'), render: (v: string) => v || '—' },
    {
      key: 'date', header: t('common.date'), sortable: true,
      render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '—',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
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
              onClick={() => { setEditingId(null); setForm(defaultForm); setImagePreview(''); setFormMode('manual'); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors self-start sm:self-auto"
          >
            <Plus size={16} /> {t('charges.new')}
          </button>
        </div>

        {/* ── Table ── */}
        <DataTable
            data={charges as any[]} columns={columns}
            searchKeys={['description', 'type', 'source']}
            isLoading={isLoading} emptyMessage={t('charges.empty')}
            actions={(row) => (
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => setDetailCharge(row)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title={t('common.view')}>
                    <Eye size={15} />
                  </button>
                  <button onClick={() => openEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('common.edit')}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(row)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={t('common.delete')}>
                    <Trash2 size={15} />
                  </button>
                </div>
            )}
        />

        {/* ══════════════════════════════════════════════════════════════════════
          Detail Modal
      ══════════════════════════════════════════════════════════════════════ */}
        {detailCharge && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailCharge(null)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>

                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 z-10">
                  <button onClick={() => setDetailCharge(null)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
                    <X size={18} />
                  </button>
                  <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex-shrink-0">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">{detailCharge.description}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[detailCharge.type] || TYPE_COLORS.other}`}>
                      {t(`charges.type.${detailCharge.type}`)}
                    </span>
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

                  {/* Image */}
                  {detailCharge.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <img
                            src={detailCharge.imageUrl}
                            alt={t('charges.receipt')}
                            className="w-full max-h-64 object-contain"
                            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                        />
                        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                          <ImageIcon size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500 truncate">{t('charges.receipt')}</span>
                          <a href={detailCharge.imageUrl} target="_blank" rel="noreferrer" className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <Link size={10} /> {t('charges.openImage')}
                          </a>
                        </div>
                      </div>
                  )}

                  {/* Amounts */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">{t('charges.amountHT')}</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatTND(detailCharge.amountHT || detailCharge.amount)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">{t('charges.amountTTC')}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatTND(detailCharge.amount + (detailCharge.tva ? (detailCharge.amountHT || detailCharge.amount) * detailCharge.tva / 100 : 0))}
                      </p>
                    </div>
                  </div>

                  {/* Details grid */}
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
                          <p className="font-medium text-gray-800 dark:text-gray-200">{format(new Date(detailCharge.createdAt), 'dd/MM/yyyy')}</p>
                        </div>
                    )}
                  </div>

                  {/* Notes */}
                  {detailCharge.notes && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-xl p-3 text-xs text-yellow-800 dark:text-yellow-200">
                        <span className="font-semibold">{t('common.notes')} : </span>{detailCharge.notes}
                      </div>
                  )}

                  {/* Actions */}
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
          Form Modal (New / Edit)
      ══════════════════════════════════════════════════════════════════════ */}
        {showForm && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={resetForm} />
              <div
                  className="relative bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
                  dir={dir}
              >
                {/* Modal header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-t-2xl px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 z-10">
                  <button onClick={resetForm} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                    <X size={18} />
                  </button>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {editingId ? t('charges.editTitle') : t('charges.newTitle')}
                  </h2>

                  {/* Mode tabs (only for new) */}
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

                        {/* OCR sub-tabs */}
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

                        {/* Upload drop zone */}
                        {ocrMode === 'upload' && (
                            <div>
                              <div
                                  onClick={() => fileInputRef.current?.click()}
                                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                  onDragLeave={() => setDragOver(false)}
                                  onDrop={handleDrop}
                                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'}`}
                              >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="preview" className="mx-auto max-h-32 rounded-lg object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                      <Upload size={28} className="text-gray-400" />
                                      <p className="text-sm text-gray-500">{t('charges.dropHere')}</p>
                                      <p className="text-xs text-gray-400">{t('charges.maxSize')}</p>
                                    </div>
                                )}
                              </div>
                              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                              {imagePreview && (
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

                        {/* URL input */}
                        {ocrMode === 'url' && (
                            <div className="space-y-2">
                              <input
                                  value={ocrUrl}
                                  onChange={e => setOcrUrl(e.target.value)}
                                  placeholder="https://example.com/facture.jpg"
                                  className={inp}
                              />
                              {ocrUrl && (
                                  <img src={ocrUrl} alt="preview" className="w-full max-h-40 object-contain rounded-xl border border-gray-200 dark:border-gray-700" onError={() => {}} />
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

                        {/* Divider */}
                        <div className="flex items-center gap-3 mt-4">
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                          <span className="text-xs text-gray-400">{t('charges.orFillManually')}</span>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        </div>
                      </div>
                  )}

                  {/* ── Manual Form ── */}
                  <form onSubmit={handleSubmit} className="space-y-3">

                    {/* Image for manual mode */}
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
                                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'}`}
                              >
                                {imagePreview ? (
                                    <div className="relative inline-block">
                                      <img src={imagePreview} alt="preview" className="max-h-28 rounded-lg object-contain mx-auto" />
                                      <button
                                          type="button"
                                          onClick={e => { e.stopPropagation(); setImagePreview(''); setForm(f => ({ ...f, imageUrl: '' })); }}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                      >✕</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 py-2">
                                      <Upload size={20} className="text-gray-400" />
                                      <p className="text-xs text-gray-500">{t('charges.dropOrClick')}</p>
                                    </div>
                                )}
                              </div>
                              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </div>
                            <div className="flex flex-col gap-2 justify-start">
                              <p className="text-xs text-gray-400 mt-1">{t('charges.orUrl')}</p>
                              <input
                                  value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                                  onChange={e => {
                                    setForm(f => ({ ...f, imageUrl: e.target.value }));
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
                        <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inp} />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {t('charges.amountHT')} (TND) <span className="text-red-500">*</span>
                        </label>
                        <input required type="number" min={0} step={0.001} value={form.amount}
                               onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} className={inp} />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('charges.tva')} (%)</label>
                        <input type="number" min={0} max={100} value={form.tva}
                               onChange={e => setForm(f => ({ ...f, tva: +e.target.value }))} className={inp} />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {t('common.date')} <span className="text-red-500">*</span>
                        </label>
                        <input required type="date" value={form.date}
                               onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inp} />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('common.type')}</label>
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                          {CHARGE_TYPES.map(ct => (
                              <option key={ct} value={ct}>{t(`charges.type.${ct}`)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('charges.reference')}</label>
                        <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className={inp} />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('common.notes')}</label>
                        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} />
                      </div>

                    </div>

                    {/* TTC preview */}
                    {form.tva > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm">
                          <span className="text-gray-500">{t('charges.amountTTC')}</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                      {formatTND(form.amount * (1 + form.tva / 100))}
                    </span>
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button
                          type="button" onClick={resetForm}
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