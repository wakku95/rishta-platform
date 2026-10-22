import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ text, className = '', iconSize = 'w-3.5 h-3.5', label = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10 ${className}`}
      title={copied ? 'Copied to clipboard!' : `Copy ${label || text}`}
    >
      {copied ? (
        <Check className={`${iconSize} text-emerald-400`} />
      ) : (
        <Copy className={`${iconSize}`} />
      )}
    </button>
  );
}
