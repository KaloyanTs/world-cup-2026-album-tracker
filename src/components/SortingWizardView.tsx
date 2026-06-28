/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Sticker, CollectionState } from '../types';
import { TEAMS } from '../data';
import { ChevronLeft, SkipForward, X, Play } from 'lucide-react';

interface SortingWizardViewProps {
  collection: CollectionState;
  allStickers: Sticker[];
  onClose: () => void;
}

type WizardStage = 'input' | 'stage1' | 'stage2_intro' | 'stage2_items' | 'finished';

interface WizardState {
  stage: WizardStage;
  stickerIndex: number;
  currentGroupIndex: number;
}

export function SortingWizardView({ collection, allStickers, onClose }: SortingWizardViewProps) {
  // ── Input stage state ─────────────────────────────────────────
  const [inputText, setInputText] = useState('');

  const parsedIds = useMemo(() => {
    return inputText
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);
  }, [inputText]);

  // ── Wizard stage state ────────────────────────────────────────
  const [filteredStickers, setFilteredStickers] = useState<Sticker[]>([]);
  const [state, setState] = useState<WizardState>({
    stage: 'input',
    stickerIndex: 0,
    currentGroupIndex: 0,
  });
  const [history, setHistory] = useState<WizardState[]>([]);

  // ── Input handlers ────────────────────────────────────────────
  const handleStartWizard = () => {
    const ids = parsedIds;
    if (ids.length === 0) return;

    const found = ids
      .map(id => allStickers.find(s => s.id === id))
      .filter((s): s is Sticker => s !== undefined);

    if (found.length === 0) return;

    setFilteredStickers(found);
    setHistory([...history, state]);
    setState({ stage: 'stage1', stickerIndex: 0, currentGroupIndex: 0 });
  };

  // ── Sorting wizard helpers ────────────────────────────────────
  const getStickerInfo = (sticker: Sticker) => {
    if (sticker.id === '00' || (sticker.id.startsWith('FWC-') && parseInt(sticker.id.split('-')[1]) <= 8)) {
      return { groupLabel: 'Intro', groupNum: 1, teamNum: 1, teamName: 'Tournament' };
    }
    if (sticker.id.startsWith('FWC-')) {
      return { groupLabel: 'History', groupNum: 14, teamNum: 1, teamName: 'History' };
    }
    if (sticker.teamCode) {
      const team = TEAMS.find(t => t.code === sticker.teamCode);
      if (team) {
        const groupLetter = team.group.split(' ')[1]; // "Group A" -> "A"
        const groupNum = groupLetter.charCodeAt(0) - 65 + 2; // A=2, B=3, …
        const teamsInGroup = TEAMS.filter(t => t.group === team.group);
        const teamNum = teamsInGroup.findIndex(t => t.code === team.code) + 1;
        return { groupLabel: groupLetter, groupNum, teamNum, teamName: team.name };
      }
    }
    return { groupLabel: '?', groupNum: 0, teamNum: 0, teamName: 'Unknown' };
  };

  const groups = useMemo(() => {
    const groupMap = new Map<number, { label: string; stickers: Sticker[] }>();

    filteredStickers.forEach(s => {
      const info = getStickerInfo(s);
      if (!groupMap.has(info.groupNum)) {
        groupMap.set(info.groupNum, { label: info.groupLabel, stickers: [] });
      }
      groupMap.get(info.groupNum)!.stickers.push(s);
    });

    return Array.from(groupMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([num, data]) => ({
        num,
        label: data.label,
        stickers: [...data.stickers].reverse(),
      }));
  }, [filteredStickers]);

  const currentSticker = filteredStickers[state.stickerIndex];
  const currentStickerInfo = currentSticker ? getStickerInfo(currentSticker) : null;
  const isOwned = currentSticker ? (collection.counts[currentSticker.id] || 0) > 0 : false;

  const handleNext = () => {
    setHistory([...history, state]);
    if (state.stage === 'stage1') {
      if (state.stickerIndex < filteredStickers.length - 1) {
        setState({ ...state, stickerIndex: state.stickerIndex + 1 });
      } else {
        setState({ stage: 'stage2_intro', stickerIndex: 0, currentGroupIndex: 0 });
      }
    } else if (state.stage === 'stage2_intro') {
      setState({ ...state, stage: 'stage2_items', stickerIndex: 0 });
    } else if (state.stage === 'stage2_items') {
      const currentGroup = groups[state.currentGroupIndex];
      if (state.stickerIndex < currentGroup.stickers.length - 1) {
        setState({ ...state, stickerIndex: state.stickerIndex + 1 });
      } else {
        if (state.currentGroupIndex < groups.length - 1) {
          setState({ stage: 'stage2_intro', currentGroupIndex: state.currentGroupIndex + 1, stickerIndex: 0 });
        } else {
          setState({ ...state, stage: 'finished' });
        }
      }
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prevState = history[history.length - 1];
      setState(prevState);
      setHistory(history.slice(0, -1));
    }
  };

  const handleSkipStage1 = () => {
    setHistory([...history, state]);
    setState({ stage: 'stage2_intro', stickerIndex: 0, currentGroupIndex: 0 });
  };

  const handleSkipGroup = () => {
    setHistory([...history, state]);
    if (state.currentGroupIndex < groups.length - 1) {
      setState({ stage: 'stage2_intro', currentGroupIndex: state.currentGroupIndex + 1, stickerIndex: 0 });
    } else {
      setState({ ...state, stage: 'finished' });
    }
  };

  // ── Render: INPUT stage ───────────────────────────────────────
  if (state.stage === 'input') {
    return (
      <div className="fixed inset-0 z-[100] bg-surface-bright text-on-background flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/30 bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-surface-variant rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tighter italic leading-none">
                Sorting Wizard
              </h2>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60 mt-1">
                Enter sticker IDs
              </p>
            </div>
          </div>

          {/* Ready button */}
          <button
            onClick={handleStartWizard}
            disabled={parsedIds.length === 0}
            className={`px-6 py-2.5 rounded-2xl font-label-bold shadow-lg active:scale-95 transition-all flex items-center gap-2 ${
              parsedIds.length > 0
                ? 'bg-primary text-on-primary shadow-primary/20'
                : 'bg-surface-container-high text-on-surface-variant opacity-50 cursor-not-allowed shadow-none'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            Ready ({parsedIds.length})
          </button>
        </header>

        {/* Main Content */}
        <div className="flex-grow overflow-y-auto p-6 pb-24">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            <label className="text-sm font-bold text-on-surface-variant">
              Paste or type sticker IDs separated by commas
            </label>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="e.g. ARG-5, BRA-3, FWC-1"
              className="w-full min-h-[120px] p-4 rounded-2xl border border-outline-variant/40 bg-white text-base font-mono font-bold text-on-surface placeholder:text-on-surface-variant/40 resize-none outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              autoFocus
            />

            {/* Parsed IDs */}
            {parsedIds.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
                  Parsed IDs ({parsedIds.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const counts = parsedIds.reduce<Record<string, number>>((acc, id) => {
                      acc[id] = (acc[id] || 0) + 1;
                      return acc;
                    }, {});
                    return parsedIds.map((id, i) => {
                      const owned = (collection.counts[id] || 0) > 0;
                      const found = allStickers.find(s => s.id === id);
                      const duped = counts[id] > 1;
                      return (
                        <div
                          key={`${id}-${i}`}
                          className={`px-4 py-2 rounded-xl text-xs font-black tracking-tighter border ${
                            !found
                              ? 'bg-gray-100 text-gray-400 border-gray-200'
                              : duped
                                ? 'bg-purple-100 text-purple-700 border-purple-300'
                                : owned
                                  ? 'bg-secondary-container/30 text-secondary border-secondary/20'
                                  : 'bg-error-container/20 text-error border-error/20'
                          }`}
                        >
                          {id}
                          {!found && <span className="ml-1 opacity-50">(?)</span>}
                          {found && duped && <span className="ml-1 opacity-70">×{counts[id]}</span>}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render: FINISHED stage ────────────────────────────────────
  if (state.stage === 'finished') {
    return (
      <div className="fixed inset-0 z-[100] bg-primary text-on-primary flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-4xl font-black mb-4 uppercase italic tracking-tighter">Sorting Complete!</h2>
        <p className="text-xl mb-8 opacity-90 font-body-md">You've gone through all stickers in your custom order.</p>
        <button
          onClick={onClose}
          className="bg-white text-primary px-10 py-4 rounded-2xl font-label-bold shadow-xl active:scale-95 transition-all"
        >
          Return to App
        </button>
      </div>
    );
  }

  // ── Render: STAGE 1 / STAGE 2 ─────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-white text-on-background flex flex-col select-none touch-none overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/30">
        <button
          onClick={handleBack}
          disabled={history.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${history.length === 0 ? 'opacity-20' : 'hover:bg-surface-variant active:scale-95'}`}
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="font-label-bold">Back</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">
            {state.stage === 'stage1' ? 'Stage 1: Group Sort' : `Stage 2: Team Sort`}
          </span>
          {state.stage === 'stage1' ? (
            <span className="text-xs font-label-bold text-on-surface-variant">
              {state.stickerIndex + 1} / {filteredStickers.length}
            </span>
          ) : state.stage === 'stage2_items' ? (
            <span className="text-xs font-label-bold text-on-surface-variant">
              Group {groups[state.currentGroupIndex].label}: {state.stickerIndex + 1} / {groups[state.currentGroupIndex].stickers.length}
            </span>
          ) : null}
        </div>

        <div className="flex gap-2">
          {state.stage === 'stage1' && (
            <button
              onClick={handleSkipStage1}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-xl hover:bg-secondary/20 active:scale-95 transition-all"
            >
              <SkipForward className="w-5 h-5" />
              <span className="font-label-bold">Skip Stage</span>
            </button>
          )}
          {state.stage === 'stage2_items' && (
            <button
              onClick={handleSkipGroup}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-xl hover:bg-secondary/20 active:scale-95 transition-all"
            >
              <SkipForward className="w-5 h-5" />
              <span className="font-label-bold">Skip Group</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-error-container hover:text-on-error-container rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-grow flex flex-col items-center justify-center p-6 cursor-pointer"
        onClick={handleNext}
      >
        {state.stage === 'stage2_intro' ? (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-primary uppercase opacity-60 mb-2">Stage 2</h3>
            <div className="text-6xl font-black text-on-surface uppercase tracking-tighter mb-4">
              Group {groups[state.currentGroupIndex].label}
            </div>
            <div className="text-3xl font-label-bold text-on-surface-variant opacity-70 mb-12">
              (Group Number {groups[state.currentGroupIndex].num})
            </div>
            <div className="bg-primary text-on-primary px-8 py-4 rounded-2xl font-label-bold shadow-lg shadow-primary/30">
              Tap to Start Group
            </div>
          </div>
        ) : (
          <>
            {/* Sticker ID */}
            <div
              className={`text-[80px] sm:text-[120px] font-black tracking-tighter leading-none mb-12 ${
                isOwned ? 'text-blue-600' : 'text-red-600'
              }`}
            >
              {(state.stage === 'stage1' ? currentSticker : groups[state.currentGroupIndex].stickers[state.stickerIndex]).id}
            </div>

            {/* Group/Team Box */}
            <div className="flex flex-col items-center gap-6">
              <div className="w-48 h-64 sm:w-64 sm:h-80 bg-surface-container-high border-4 border-primary rounded-[32px] flex items-center justify-center shadow-2xl">
                <span className="text-[120px] sm:text-[180px] font-black text-primary leading-none">
                  {state.stage === 'stage1'
                    ? currentStickerInfo?.groupNum
                    : getStickerInfo(groups[state.currentGroupIndex].stickers[state.stickerIndex]).teamNum}
                </span>
              </div>

              <div className="text-center">
                <span className="text-xl font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                  {state.stage === 'stage1' ? 'Target Group' : 'Target Team'}
                </span>
                <div className="text-2xl font-bold text-on-surface mt-1">
                  {state.stage === 'stage1'
                    ? `Group ${currentStickerInfo?.groupLabel}`
                    : getStickerInfo(groups[state.currentGroupIndex].stickers[state.stickerIndex]).teamName}
                </div>
              </div>
            </div>

            <div className="mt-auto mb-12 text-on-surface-variant opacity-30 font-label-bold animate-pulse">
              Tap anywhere for next sticker
            </div>
          </>
        )}
      </div>
    </div>
  );
}
