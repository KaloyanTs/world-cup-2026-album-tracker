/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CollectionState, Sticker } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCcw,
  Handshake,
  Copy,
  ClipboardCheckIcon,
  ArrowUpDown
} from 'lucide-react';
import { TEAMS } from '../data';

interface NeedsMatcherViewProps {
  collection: CollectionState;
  allStickers: Sticker[];
}

interface MatchedId {
  id: string;
  hasDuplicate: boolean;
  valid: boolean;
}

export function NeedsMatcherView({ collection, allStickers }: NeedsMatcherViewProps) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<MatchedId[]>([]);
  const [stats, setStats] = useState({ total: 0, hasDuplicate: 0, noDuplicate: 0 });
  const [sampleSize, setSampleSize] = useState<number | ''>(5);
  const [sampledResult, setSampledResult] = useState('');
  const [showHasDuplicate, setShowHasDuplicate] = useState(true);
  const [showNoDuplicate, setShowNoDuplicate] = useState(true);
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

    const newResults: MatchedId[] = tokens.map(token => {
      const cleanId = token.toUpperCase().replace('#', '');
      const sticker = stickersMap.get(cleanId);
      // "duplicate" means count > 1 (the user owns at least one extra copy)
      const hasDuplicate = cleanId ? (collection.counts[cleanId] || 0) > 1 : false;
      return {
        id: token,
        hasDuplicate,
        valid: !!sticker
      };
    });

    const total = newResults.length;
    const hasDuplicateCount = newResults.filter(r => r.hasDuplicate && r.valid).length;
    const noDuplicateCount = newResults.filter(r => !r.hasDuplicate && r.valid).length;
    
    setStats({ total, hasDuplicate: hasDuplicateCount, noDuplicate: noDuplicateCount });
    setResults(newResults);
    setShowHasDuplicate(true);
    setShowNoDuplicate(true);
    setIsChecked(true);
  };

  const handleSample = () => {
    const duplicateIds = results
      .filter(r => r.hasDuplicate && r.valid)
      .map(r => {
        const cleanId = r.id.toUpperCase().replace('#', '').trim();
        return cleanId;
      });
    
    // Remove duplicates from the list before sampling
    const uniqueDuplicateIds = Array.from(new Set(duplicateIds));
    
    if (uniqueDuplicateIds.length === 0 || !sampleSize || sampleSize <= 0) {
      setSampledResult('');
      return;
    }
    
    const shuffled = [...uniqueDuplicateIds].sort(() => 0.5 - Math.random());
    const sampled = shuffled.slice(0, Math.min(Number(sampleSize), shuffled.length));
    setSampledResult(sampled.join(', '));
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

  const handleSort = () => {
    const tokens = input.split(',').map(s => s.trim()).filter(Boolean);
    
    tokens.sort((a, b) => {
      const idA = a.toUpperCase().replace('#', '');
      const idB = b.toUpperCase().replace('#', '');
      const stickerA = stickersMap.get(idA);
      const stickerB = stickersMap.get(idB);
      
      if (!stickerA && !stickerB) return a.localeCompare(b);
      if (!stickerA) return 1;
      if (!stickerB) return -1;

      if (stickerA.id === "00") return -1;
      if (stickerB.id === "00") return 1;

      const aIsFwc = stickerA.id.startsWith("FWC-");
      const bIsFwc = stickerB.id.startsWith("FWC-");

      if (aIsFwc && !bIsFwc) {
        const num = parseInt(stickerA.id.split("-")[1]);
        return num <= 8 ? -1 : 1;
      }
      if (!aIsFwc && bIsFwc) {
        const num = parseInt(stickerB.id.split("-")[1]);
        return num <= 8 ? 1 : -1;
      }
      if (aIsFwc && bIsFwc) {
        const aNum = parseInt(stickerA.id.split("-")[1]);
        const bNum = parseInt(stickerB.id.split("-")[1]);
        const aCategory = aNum <= 8 ? 0 : 2;
        const bCategory = bNum <= 8 ? 0 : 2;
        if (aCategory !== bCategory) return aCategory - bCategory;
        return aNum - bNum;
      }

      if (stickerA.teamCode && stickerB.teamCode) {
        if (stickerA.teamCode === stickerB.teamCode) {
          return (stickerA.number || 0) - (stickerB.number || 0);
        }
        const aIdx = TEAMS.findIndex(t => t.code === stickerA.teamCode);
        const bIdx = TEAMS.findIndex(t => t.code === stickerB.teamCode);
        return aIdx - bIdx;
      }

      return 0;
    });

    const sortedInput = tokens.join(', ');
    setInput(sortedInput);

    if (isChecked) {
      const newResults = tokens.map(token => {
        const cleanId = token.toUpperCase().replace('#', '');
        const sticker = stickersMap.get(cleanId);
        const hasDuplicate = cleanId ? (collection.counts[cleanId] || 0) > 1 : false;
        return {
          id: token,
          hasDuplicate,
          valid: !!sticker
        };
      });
      setResults(newResults);
      
      const total = newResults.length;
      const hasDuplicateCount = newResults.filter(r => r.hasDuplicate && r.valid).length;
      const noDuplicateCount = newResults.filter(r => !r.hasDuplicate && r.valid).length;
      setStats({ total, hasDuplicate: hasDuplicateCount, noDuplicate: noDuplicateCount });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setIsChecked(false); // Reset coloring state when edited
    setStats({ total: 0, hasDuplicate: 0, noDuplicate: 0 });
  };

  const filteredResults = results.filter(r => {
    if (r.hasDuplicate) return showHasDuplicate;
    return showNoDuplicate;
  });

  return (
    <div id="needs-matcher-tab" className="max-w-4xl mx-auto w-full flex flex-col gap-8 pb-12 select-none">
      <div id="needs-matcher-header">
        <h2 className="font-display-lg text-3xl font-extrabold text-primary mb-2 flex items-center gap-2">
          <Handshake className="w-8 h-8 text-primary" />
          Needs Matcher
        </h2>
        <p className="text-on-surface-variant font-body-lg text-sm sm:text-base leading-relaxed">
          Paste someone else's needed stickers to see which ones you can offer. Stickers you have <span className="text-green-600 font-bold">duplicates</span> of are highlighted in green — the rest appear in black.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wide">
            Enter Needed Sticker IDs (comma separated)
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
                        r.hasDuplicate ? 'text-green-600' : 'text-gray-900 dark:text-gray-800'
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

        {isChecked && (
          <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-surface-container-high px-4 py-2 rounded-lg border border-outline-variant">
              <span className="text-xs font-label-bold text-on-surface-variant uppercase block">Total IDs</span>
              <span className="text-lg font-bold text-on-surface">{stats.total}</span>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100">
              <span className="text-xs font-label-bold text-green-700 uppercase block">Can Offer</span>
              <span className="text-lg font-bold text-green-900">{stats.hasDuplicate}</span>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
              <span className="text-xs font-label-bold text-gray-700 uppercase block">Not Owned Dupl.</span>
              <span className="text-lg font-bold text-gray-900">{stats.noDuplicate}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <button
            onClick={handleCheck}
            className="w-full sm:w-auto bg-primary text-on-primary font-label-bold py-3 px-8 rounded-full shadow-md hover:bg-surface-tint active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Search className="w-4 h-4" />
            Match
          </button>

          <div className="w-full sm:w-auto flex rounded-full shadow-md">
            <button
              onClick={handleCopy}
              className={`flex-1 sm:flex-none font-label-bold py-3 px-6 rounded-l-full active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm border border-r-0 ${
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
            <button
              onClick={handleSort}
              className="flex-1 sm:flex-none font-label-bold py-3 px-6 rounded-r-full active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm border bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container-high"
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort
            </button>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showNoDuplicate}
                  onChange={(e) => setShowNoDuplicate(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  showNoDuplicate ? 'bg-gray-900 border-gray-900' : 'border-outline-variant'
                }`}>
                  {showNoDuplicate && <XCircle className="w-4 h-4 text-white" />}
                </div>
              </div>
              <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">
                No Duplicate (Black)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showHasDuplicate}
                  onChange={(e) => setShowHasDuplicate(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  showHasDuplicate ? 'bg-green-600 border-green-600' : 'border-outline-variant'
                }`}>
                  {showHasDuplicate && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>
              <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">
                Has Duplicate (Green)
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h4 className="font-label-bold text-on-surface text-sm uppercase tracking-wide flex items-center gap-2">
            <Handshake className="w-4 h-4 text-primary" />
            Sample Tradable Duplicates
          </h4>
          <p className="text-xs text-on-surface-variant">
            Randomly select a few stickers from the duplicates you can offer.
          </p>
          
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex flex-col gap-2 w-full sm:w-32">
              <label className="text-[10px] font-bold uppercase text-outline">Count</label>
              <input 
                type="number"
                value={sampleSize}
                onChange={(e) => setSampleSize(e.target.value === '' ? '' : parseInt(e.target.value))}
                min="1"
                className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <button
              onClick={handleSample}
              disabled={!isChecked || stats.hasDuplicate === 0}
              className="w-full sm:w-auto bg-secondary text-on-secondary font-label-bold py-3 px-8 rounded-full shadow-md hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none text-sm"
            >
              Sample
            </button>
          </div>

          {sampledResult && (
            <div className="mt-2 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-primary">Sampled Results</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(sampledResult);
                  }}
                  className="text-[10px] font-bold text-on-surface-variant hover:text-primary flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy Sample
                </button>
              </div>
              <p className="font-mono text-sm break-words">{sampledResult}</p>
            </div>
          )}
        </div>

        <hr className="border-outline-variant opacity-50" />

        <div className="flex flex-col gap-4">
          <h4 className="font-label-bold text-on-surface text-sm uppercase tracking-wide flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 text-primary" />
            How it works
          </h4>
          <div className="text-xs text-on-surface-variant space-y-3 leading-relaxed">
            <p>
              1. Paste the list of sticker IDs that someone else needs, separated by commas.
            </p>
            <p>
              2. Click <span className="font-bold">Match</span> to cross-reference with your duplicates.
            </p>
            <p>
              3. Stickers you <span className="text-green-600 font-bold">have as duplicates</span> will turn green — you can offer these!
            </p>
            <p>
              4. Stickers you <span className="text-gray-900 font-bold">don't have as duplicates</span> will stay black.
            </p>
            <p>
              5. Use the toggles to filter the view and the Copy button to share the result.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
