/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CollectionState, Sticker } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCcw,
  ClipboardCheck,
  Copy,
  ClipboardCheckIcon
} from 'lucide-react';

interface CheckViewProps {
  collection: CollectionState;
  allStickers: Sticker[];
}

interface CheckedId {
  id: string;
  owned: boolean;
  valid: boolean;
}

export function CheckView({ collection, allStickers }: CheckViewProps) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<CheckedId[]>([]);
  const [showOwned, setShowOwned] = useState(true);
  const [showUnowned, setShowUnowned] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const [copied, setCopied] = useState(false);

  const stickersMap = useMemo(() => {
    const map = new Map<string, Sticker>();
    for (const s of allStickers) {
      map.set(s.id, s);
    }
    return map;
  }, [allStickers]);

  const handleCheck = () => {
    const tokens = input
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newResults: CheckedId[] = tokens.map(token => {
      const cleanId = token.toUpperCase().replace('#', '');
      const sticker = stickersMap.get(cleanId);
      const owned = cleanId ? (collection.counts[cleanId] || 0) > 0 : false;
      return {
        id: token,
        owned,
        valid: !!sticker
      };
    });

    setResults(newResults);
    setShowOwned(true);
    setShowUnowned(true);
    setIsChecked(true);
  };

  const handleCopy = async () => {
    let textToCopy: string;
    if (isChecked) {
      // Copy the currently visible (filtered) sticker IDs
      textToCopy = filteredResults.map(r => r.id).join(', ');
    } else {
      textToCopy = input;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for environments where clipboard API is unavailable
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setIsChecked(false); // Reset coloring state when edited
  };

  const filteredResults = results.filter(r => {
    if (r.owned) return showOwned;
    return showUnowned;
  });

  return (
    <div id="check-tab" className="max-w-4xl mx-auto w-full flex flex-col gap-8 pb-12 select-none">
      <div id="check-header">
        <h2 className="font-display-lg text-3xl font-extrabold text-primary mb-2 flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8 text-primary" />
          Sticker Ownership Check
        </h2>
        <p className="text-on-surface-variant font-body-lg text-sm sm:text-base leading-relaxed">
          Quickly check which stickers you already have and which ones are missing. Paste a comma-separated list of IDs to see their status.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wide">
            Enter Sticker IDs (comma separated)
          </label>
          <div className="relative">
            {isChecked ? (
              <div 
                className="w-full min-h-[120px] p-4 bg-surface-container-low border border-outline-variant rounded-xl font-mono text-sm overflow-y-auto cursor-text whitespace-pre-wrap break-words"
                onClick={() => setIsChecked(false)}
              >
                {filteredResults.map((r, i) => (
                  <React.Fragment key={i}>
                    <span 
                      className={`font-bold ${
                        r.owned ? 'text-blue-600' : 'text-red-600'
                      }`}
                    >
                      {r.id}
                    </span>
                    {i < filteredResults.length - 1 ? ', ' : ''}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="e.g. ARG-1, MEX-5, FWC-10..."
                rows={5}
                className="w-full p-4 bg-surface-container-low border border-outline-variant rounded-xl font-mono text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:font-sans placeholder:text-outline resize-none"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <button
            onClick={handleCheck}
            className="w-full sm:w-auto bg-primary text-on-primary font-label-bold py-3 px-8 rounded-full shadow-md hover:bg-surface-tint active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Search className="w-4 h-4" />
            Check
          </button>

          <button
            onClick={handleCopy}
            className={`w-full sm:w-auto font-label-bold py-3 px-8 rounded-full shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm border ${
              copied
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container-high'
            }`}
          >
            {copied ? (
              <>
                <ClipboardCheckIcon className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showUnowned}
                  onChange={(e) => setShowUnowned(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  showUnowned ? 'bg-red-600 border-red-600' : 'border-outline-variant'
                }`}>
                  {showUnowned && <XCircle className="w-4 h-4 text-white" />}
                </div>
              </div>
              <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">
                Missing (Red)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showOwned}
                  onChange={(e) => setShowOwned(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  showOwned ? 'bg-blue-600 border-blue-600' : 'border-outline-variant'
                }`}>
                  {showOwned && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>
              <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">
                Owned (Blue)
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl flex flex-col gap-4">
        <h4 className="font-label-bold text-on-surface text-sm uppercase tracking-wide flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-primary" />
          How it works
        </h4>
        <div className="text-xs text-on-surface-variant space-y-3 leading-relaxed">
          <p>
            1. Paste your list of sticker IDs separated by commas.
          </p>
          <p>
            2. Click <span className="font-bold">Check</span> to analyze your collection.
          </p>
          <p>
            3. Stickers you <span className="text-blue-600 font-bold">already own</span> will turn blue.
          </p>
          <p>
            4. Stickers you are <span className="text-red-600 font-bold">missing</span> will turn red.
          </p>
          <p>
            5. Use the toggles to filter the view and focus on what you need.
          </p>
        </div>
      </div>
    </div>
  );
}
