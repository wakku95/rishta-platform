import React, { useState, useEffect } from 'react';
import { 
  Database, Download, Trash2, RefreshCw, HardDrive, 
  CheckCircle2, AlertTriangle, FileArchive, Clock, ShieldCheck, 
  Layers, Info, FileText 
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminBackupTab() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [data, setData] = useState({ database: null, backups: [] });
  const [compressOption, setCompressOption] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    fetchInfo();
  }, []);

  const fetchInfo = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await adminApi.getBackupInfo();
      setData(res || { database: null, backups: [] });
    } catch (err) {
      console.error('Failed to load backup info:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load database status.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndDownload = async () => {
    setCreating(true);
    setStatusMessage(null);
    try {
      const backup = await adminApi.createBackup({ compress: compressOption });
      setStatusMessage({ type: 'success', text: `Backup "${backup.filename}" created successfully!` });
      // Trigger download
      await triggerBlobDownload(backup.filename);
      // Refresh list
      fetchInfo();
    } catch (err) {
      console.error('Failed to create backup:', err);
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate backup.' });
    } finally {
      setCreating(false);
    }
  };

  const triggerBlobDownload = async (filename) => {
    setDownloadingFile(filename);
    try {
      const res = await adminApi.downloadBackupBlob(filename);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download backup:', err);
      alert('Failed to download backup file.');
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to permanently delete backup "${filename}"?`)) {
      return;
    }

    try {
      await adminApi.deleteBackup(filename);
      setData(prev => ({
        ...prev,
        backups: prev.backups.filter(b => b.filename !== filename),
      }));
      setStatusMessage({ type: 'success', text: `Backup "${filename}" deleted.` });
    } catch (err) {
      console.error('Failed to delete backup:', err);
      alert(err.response?.data?.message || 'Failed to delete backup.');
    }
  };

  const db = data.database;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-navy-800/60 p-5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Database Backups & Export
            </h2>
            <p className="text-xs text-slate-400">
              One-click complete SQL database backups for safe local archiving and emergency recovery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInfo}
            disabled={loading}
            className="text-xs border-white/10 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateAndDownload}
            disabled={creating || loading}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md shadow-cyan-500/20 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {creating ? 'Generating SQL Dump...' : 'Download Instant Backup'}
          </Button>
        </div>
      </div>

      {/* Alert Status */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2.5 border ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Database Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Database Name</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-lg font-black text-white mt-2 font-mono truncate">
            {db?.database_name || 'Loading...'}
          </p>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Engine: {db?.driver || 'MySQL'}
          </span>
        </Card>

        <Card variant="glass" className="p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Tables</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-lg font-black text-white mt-2 font-mono">
            {db?.tables_count ?? '...'} Tables
          </p>
          <span className="text-[10px] text-slate-400 font-semibold">
            All tables included in backup
          </span>
        </Card>

        <Card variant="glass" className="p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Estimated Size</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-black text-white mt-2 font-mono">
            {db?.approx_size_formatted || '0 B'}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold">
            ~{db?.approx_rows?.toLocaleString() ?? 0} total records
          </span>
        </Card>

        <Card variant="glass" className="p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Server Backups</span>
            <FileArchive className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg font-black text-white mt-2 font-mono">
            {data.backups.length} Files
          </p>
          <span className="text-[10px] text-slate-400 font-semibold">
            Stored in storage/app/backups
          </span>
        </Card>
      </div>

      {/* Export Options Card */}
      <Card variant="glass" className="p-5 border border-white/10">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Backup Configuration & Quick Download
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={compressOption}
                onChange={(e) => setCompressOption(e.target.checked)}
                className="rounded border-slate-700 bg-navy-900 text-cyan-500 focus:ring-cyan-500/20"
              />
              <span>Gzip Compression (.sql.gz)</span>
            </label>
            <p className="text-[11px] text-slate-400 pl-5">
              Unchecked generates standard <code>.sql</code> which can be imported directly into phpMyAdmin without unzipping.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleCreateAndDownload}
            disabled={creating || loading}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {creating ? 'Generating & Downloading...' : 'Create & Download Backup Now'}
          </Button>
        </div>
      </Card>

      {/* Backups Archive Table */}
      <Card variant="glass" className="p-5 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Saved Backup Files on Server
            </h3>
            <p className="text-xs text-slate-400">
              Backups previously generated and saved on the server.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {data.backups.length} archive{data.backups.length === 1 ? '' : 's'}
          </span>
        </div>

        {data.backups.length === 0 ? (
          <div className="text-center py-8">
            <FileArchive className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">No backup files found on the server.</p>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;Download Instant Backup&quot; above to create your first backup.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Backup Filename</th>
                  <th className="py-2.5 px-3 font-semibold">Size</th>
                  <th className="py-2.5 px-3 font-semibold">Created At</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {data.backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-white/5 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-white">{b.filename}</span>
                        {b.is_compressed && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            GZIP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{b.size_formatted}</td>
                    <td className="py-3 px-3 text-slate-400">
                      <div>{new Date(b.created_at).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{b.created_at_human}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => triggerBlobDownload(b.filename)}
                          disabled={downloadingFile === b.filename}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 font-sans font-bold transition disabled:opacity-50"
                        >
                          <Download className="w-3 h-3" />
                          {downloadingFile === b.filename ? 'Downloading...' : 'Download'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.filename)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 font-sans transition"
                          title="Delete backup file"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Restore Instructions Guide */}
      <Card variant="glass" className="p-5 border border-white/10 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          How to Restore This Backup in phpMyAdmin (Emergency Recovery)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 text-xs text-slate-300">
          <div className="bg-navy-900/60 p-3 rounded-xl border border-white/5 space-y-1">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] mb-1">
              1
            </span>
            <p className="font-semibold text-white">Download File</p>
            <p className="text-slate-400 text-[11px]">Download the latest <code>.sql</code> backup file to your computer.</p>
          </div>

          <div className="bg-navy-900/60 p-3 rounded-xl border border-white/5 space-y-1">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] mb-1">
              2
            </span>
            <p className="font-semibold text-white">Open phpMyAdmin</p>
            <p className="text-slate-400 text-[11px]">Login to cPanel, open <b>phpMyAdmin</b>, and click on your database name on the left.</p>
          </div>

          <div className="bg-navy-900/60 p-3 rounded-xl border border-white/5 space-y-1">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] mb-1">
              3
            </span>
            <p className="font-semibold text-white">Go to Import Tab</p>
            <p className="text-slate-400 text-[11px]">Click on the <b>&quot;Import&quot;</b> tab at the top navigation bar.</p>
          </div>

          <div className="bg-navy-900/60 p-3 rounded-xl border border-white/5 space-y-1">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] mb-1">
              4
            </span>
            <p className="font-semibold text-white">Upload &amp; Restore</p>
            <p className="text-slate-400 text-[11px]">Choose the <code>.sql</code> file and click <b>&quot;Import&quot;</b> at the bottom. Your platform will be fully restored!</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
