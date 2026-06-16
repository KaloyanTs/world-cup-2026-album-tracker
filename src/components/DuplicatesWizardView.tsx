/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sticker, CollectionState, Team } from '../types';
import { TEAMS } from '../data';
import { X, ChevronLeft, Check, Trash2, AlertTriangle } from 'lucide-react';

interface DuplicatesWizardViewProps {
  collection: CollectionState;
  onClose: () => void;
  onComplete: (newCounts: { [id: string]: number }) => void;
}

type WizardStage = 'confirmation' | 'countries' | 'numbers';

export function DuplicatesWizardView({ collection, onClose, onComplete }: DuplicatesWizardViewProps) {
  const [stage, setStage] = useState<WizardStage>('confirmation');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [wizardCounts, setWizardCounts] = useState<{ [id: string]: number }>({});
  const [addedList, setAddedList] = useState<string[]>([]);

  const handleStartFresh = () => {
    // We start with a base of the current collection but with duplicates wiped (max 1)
    const baseCounts: { [id: string]: number } = {};
    Object.keys(collection.counts).forEach(id => {
      baseCounts[id] = Math.min(1, collection.counts[id] || 0);
    });
    setWizardCounts(baseCounts);
    setStage('countries');
  };

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    setStage('numbers');
  };

  const handleSelectNumber = (num: number) => {
    if (!selectedTeam) return;
    const stickerId = `${selectedTeam.code}-${num}`;
    
    setWizardCounts(prev => ({
      ...prev,
      [stickerId]: (prev[stickerId] || 0) + 1
    }));
    setAddedList(prev => [stickerId, ...prev]);
    
    // Immediately return to countries for the next duplicate
    setStage('countries');
    setSelectedTeam(null);
  };

  const handleReady = () => {
    onComplete(wizardCounts);
  };

  if (stage === 'confirmation') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-[40px] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-error-container text-error rounded-full flex items-center justify-center mb-6">
              <Trash2 className="w-10 h-10" />
            </div>
            
            <h2 className="text-3xl font-black text-on-surface uppercase tracking-tighter italic mb-4">Reset Duplicates?</h2>
            <p className="text-on-surface-variant font-body-md mb-8">
              This wizard will <span className="font-bold text-error">delete ALL</span> your current duplicate entries. You will then re-enter them one by one.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleStartFresh}
                className="w-full bg-primary text-on-primary py-5 rounded-3xl font-label-bold text-lg shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <Check className="w-6 h-6" />
                Yes, Start Fresh
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-surface-container-high text-on-surface-variant py-4 rounded-2xl font-label-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-surface-bright text-on-background flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/30 bg-white">
        <div className="flex items-center gap-4">
          <button 
            onClick={stage === 'numbers' ? () => setStage('countries') : onClose}
            className="p-2.5 hover:bg-surface-variant rounded-full transition-all"
          >
            {stage === 'numbers' ? <ChevronLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
          </button>
          <div>
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter italic leading-none">
              Duplicates Wizard
            </h2>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60 mt-1">
              {stage === 'countries' ? 'Select Country' : `Select Number: ${selectedTeam?.name}`}
            </p>
          </div>
        </div>

        <button 
          onClick={handleReady}
          className="bg-secondary text-on-secondary px-6 py-2.5 rounded-2xl font-label-bold shadow-lg shadow-secondary/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          Ready
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto p-3 pb-24">
        {stage === 'countries' ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {TEAMS.map(team => (
                <button
                  key={team.code}
                  onClick={() => handleSelectTeam(team)}
                  className="flex flex-col items-center justify-center aspect-square bg-white border border-outline-variant/40 rounded-xl p-1 hover:border-primary hover:bg-primary/5 transition-all active:scale-95 shadow-sm"
                >
                  <span className="text-2xl mb-0.5">{team.flagEmoji}</span>
                  <span className="text-[9px] font-black uppercase tracking-tighter text-on-surface text-center line-clamp-1">
                    {team.code}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-center mt-2 pb-4">
              <button
                onClick={() => handleSelectTeam({ name: "FIFA World Cup", code: "FWC", group: "Special", flagEmoji: "🏆" } as any)}
                className="flex flex-col items-center justify-center w-20 h-20 bg-primary/10 border-2 border-primary/30 rounded-2xl p-2 hover:border-primary hover:bg-primary/20 transition-all active:scale-95 shadow-md"
              >
                <span className="text-3xl mb-1">🏆</span>
                <span className="text-[10px] font-black uppercase tracking-tight text-primary text-center">
                  FWC
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 rounded-2xl border border-primary/10">
              <span className="text-3xl">{selectedTeam?.flagEmoji}</span>
              <div>
                <h3 className="text-lg font-black text-on-surface uppercase tracking-tighter italic">
                  {selectedTeam?.name}
                </h3>
                <p className="text-[10px] font-label-bold text-on-surface-variant opacity-60">
                  Select sticker number
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => handleSelectNumber(num)}
                  className="aspect-square bg-white border border-outline-variant/50 rounded-xl flex items-center justify-center text-lg font-black text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all active:scale-90 shadow-sm"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Bar */}
      {addedList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-outline-variant/30 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
              Recently Added ({addedList.length})
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {addedList.slice(0, 10).map((id, i) => {
              const isOwned = (collection.counts[id] || 0) > 0;
              return (
                <div 
                  key={`${id}-${i}`}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black tracking-tighter border animate-in slide-in-from-left-4 duration-300 ${
                    isOwned 
                      ? 'bg-secondary-container/30 text-secondary border-secondary/20' 
                      : 'bg-error-container/20 text-error border-error/20'
                  }`}
                >
                  {id}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
