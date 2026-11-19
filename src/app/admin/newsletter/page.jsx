'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Mail, Download, Send, FlaskConical, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminHeader from '@/components/admin/header';
import { blogAPI, newsletterAPI } from '@/lib/api';

const DAILY_CAP = 40; // keep in sync with the backend NEWSLETTER_DAILY_CAP default
const EMPTY_CUSTOM = { subject: '', title: '', body: '', imageUrl: '', ctaLabel: '', ctaUrl: '' };

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

export default function AdminNewsletterPage() {
  const t = useTranslations('admin.newsletter');
  const locale = useLocale();
  const [subscribers, setSubscribers] = useState([]);
  const [counts, setCounts] = useState({ subscribed: 0, unsubscribed: 0 });
  const [campaigns, setCampaigns] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [kind, setKind] = useState('blog');
  const [blogId, setBlogId] = useState('');
  const [blogSubject, setBlogSubject] = useState('');
  const [custom, setCustom] = useState(EMPTY_CUSTOM);
  const [busy, setBusy] = useState(null); // 'test' | 'send' | 'export'
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text }

  const load = useCallback(async () => {
    try {
      const [subs, camps] = await Promise.all([newsletterAPI.subscribers(), newsletterAPI.campaigns()]);
      setSubscribers(subs?.data?.subscribers || []);
      setCounts(subs?.data?.counts || { subscribed: 0, unsubscribed: 0 });
      setCampaigns(camps?.data || []);
    } catch (error) {
      setNotice({ type: 'error', text: error.message || t('error') });
    }
  }, [t]);

  useEffect(() => {
    load();
    blogAPI
      .listAdmin()
      .catch(() => blogAPI.list())
      .then((res) => setBlogs(res?.data || res || []))
      .catch(() => setBlogs([]));
  }, [load]);

  // Progress of a campaign being sent refreshes on its own.
  useEffect(() => {
    if (!campaigns.some((c) => c.status === 'sending')) return undefined;
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [campaigns, load]);

  const payload = useMemo(
    () => (kind === 'blog' ? { kind, blogId, subject: blogSubject } : { kind, ...custom }),
    [kind, blogId, blogSubject, custom]
  );
  const canSubmit = kind === 'blog' ? Boolean(blogId) : Boolean(custom.subject && custom.title && custom.body);

  const run = async (action, fn) => {
    setBusy(action);
    setNotice(null);
    try {
      await fn();
    } catch (error) {
      setNotice({ type: 'error', text: error.message || t('error') });
    } finally {
      setBusy(null);
    }
  };

  const sendTest = () =>
    run('test', async () => {
      await newsletterAPI.sendTest(payload);
      setNotice({ type: 'success', text: t('testSent') });
    });

  const send = () =>
    run('send', async () => {
      await newsletterAPI.create(payload);
      setConfirming(false);
      setCustom(EMPTY_CUSTOM);
      setBlogId('');
      setBlogSubject('');
      setNotice({ type: 'success', text: t('queued', { cap: DAILY_CAP }) });
      await load();
    });

  const exportCsv = () =>
    run('export', async () => {
      const blob = await newsletterAPI.exportCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'newsletter-inscrits.csv';
      link.click();
      URL.revokeObjectURL(url);
    });

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <AdminHeader />
      <div className="space-y-8 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <Mail className="h-6 w-6 text-slate-500" /> {t('title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 px-4 py-2 text-center">
              <p className="text-xl font-semibold text-emerald-700">{counts.subscribed}</p>
              <p className="text-xs text-slate-500">{t('subscribed')}</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-2 text-center">
              <p className="text-xl font-semibold text-slate-700">{counts.unsubscribed}</p>
              <p className="text-xs text-slate-500">{t('unsubscribed')}</p>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={busy === 'export'}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Download className="h-4 w-4" /> {t('export')}
            </button>
          </div>
        </div>

        {notice && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              notice.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {notice.text}
          </div>
        )}

        {/* Composer */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t('newCampaign')}</h2>
          </div>
          <div className="space-y-5 p-6">
            <div className="inline-flex rounded-lg border border-slate-200 p-1">
              {['blog', 'custom'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setKind(value); setConfirming(false); }}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                    kind === value ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {value === 'blog' ? t('kindBlog') : t('kindCustom')}
                </button>
              ))}
            </div>

            {kind === 'blog' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  {t('chooseBlog')}
                  <select value={blogId} onChange={(e) => setBlogId(e.target.value)} className={`${inputClass} mt-1`}>
                    <option value="">{t('chooseBlogPlaceholder')}</option>
                    {blogs.map((blog) => (
                      <option key={blog._id} value={blog._id}>{blog.title}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-700">
                  {t('subjectOptional')}
                  <input value={blogSubject} onChange={(e) => setBlogSubject(e.target.value)} className={`${inputClass} mt-1`} maxLength={200} />
                </label>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['subject', t('subject')],
                  ['title', t('emailTitle')],
                ].map(([key, label]) => (
                  <label key={key} className="block text-sm text-slate-700">
                    {label}
                    <input
                      value={custom[key]}
                      onChange={(e) => setCustom((prev) => ({ ...prev, [key]: e.target.value }))}
                      className={`${inputClass} mt-1`}
                      maxLength={200}
                    />
                  </label>
                ))}
                <label className="block text-sm text-slate-700 md:col-span-2">
                  {t('body')}
                  <textarea
                    value={custom.body}
                    onChange={(e) => setCustom((prev) => ({ ...prev, body: e.target.value }))}
                    rows={8}
                    className={`${inputClass} mt-1`}
                    maxLength={10000}
                  />
                </label>
                {[
                  ['imageUrl', t('imageUrl')],
                  ['ctaLabel', t('ctaLabel')],
                  ['ctaUrl', t('ctaUrl')],
                ].map(([key, label]) => (
                  <label key={key} className="block text-sm text-slate-700">
                    {label}
                    <input
                      value={custom[key]}
                      onChange={(e) => setCustom((prev) => ({ ...prev, [key]: e.target.value }))}
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={sendTest}
                disabled={!canSubmit || busy !== null}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {busy === 'test' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                {t('sendTest')}
              </button>

              {confirming ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{t('confirm', { count: counts.subscribed })}</span>
                  <button
                    type="button"
                    onClick={send}
                    disabled={busy !== null}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {busy === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {t('confirmYes')}
                  </button>
                  <button type="button" onClick={() => setConfirming(false)} className="px-3 py-2 text-sm text-slate-600 hover:underline">
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={!canSubmit || busy !== null || counts.subscribed === 0}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> {t('send', { count: counts.subscribed })}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* History */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t('history')}</h2>
          </div>
          {campaigns.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">{t('noCampaign')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3">{t('colDate')}</th>
                    <th className="px-6 py-3">{t('colSubject')}</th>
                    <th className="px-6 py-3">{t('colKind')}</th>
                    <th className="px-6 py-3">{t('colStatus')}</th>
                    <th className="px-6 py-3">{t('colProgress')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((c) => (
                    <tr key={c._id}>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-600">{formatDate(c.createdAt)}</td>
                      <td className="px-6 py-3 text-slate-900">{c.subject}</td>
                      <td className="px-6 py-3 text-slate-600">{c.kind === 'blog' ? t('kindBlog') : t('kindCustom')}</td>
                      <td className="px-6 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {c.status === 'sent' ? t('statusSent') : t('statusSending')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{c.sentCount} / {c.recipientsTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Subscribers */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t('subscribers')}</h2>
          </div>
          {subscribers.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">{t('noSubscriber')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3">{t('colEmail')}</th>
                    <th className="px-6 py-3">{t('colStatus')}</th>
                    <th className="px-6 py-3">{t('colSince')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscribers.map((s) => (
                    <tr key={s._id}>
                      <td className="px-6 py-3 text-slate-900">{s.email}</td>
                      <td className="px-6 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'subscribed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {s.status === 'subscribed' ? t('activeLabel') : t('inactiveLabel')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{formatDate(s.consentAt || s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
