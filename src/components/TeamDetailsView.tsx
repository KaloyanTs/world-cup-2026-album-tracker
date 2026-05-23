/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CollectionState, Sticker, Team } from '../types';
import { 
  ArrowLeft, 
  Sparkles, 
  Shield, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Minus,
  Camera as CameraIcon,
  User,
  X
} from 'lucide-react';
import { Camera, CameraResultType } from '@capacitor/camera';

interface TeamDetailsViewProps {
  team: Team;
  collection: CollectionState;
  allStickers: Sticker[];
  updateStickerCount: (stickerId: string, delta: number, comment?: string, photoUrl?: string) => void;
  saveStickerPhoto: (stickerId: string, photoUrl: string) => void;
  onBack: () => void;
}

export function TeamDetailsView({
  team,
  collection,
  allStickers,
  updateStickerCount,
  saveStickerPhoto,
  onBack
}: TeamDetailsViewProps) {
  // Grab the 20 stickers for this team
  const squadStickers = React.useMemo(() => {
    return allStickers.filter(s => s.teamCode === team.code).sort((a,b) => a.number - b.number);
  }, [allStickers, team]);

  // Adjust modal state
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);

  // Statistics
  const totalCount = squadStickers.length; // Always 20
  const ownedCount = squadStickers.filter(s => (collection.counts[s.id] || 0) > 0).length;
  const neededCount = totalCount - ownedCount;
  
  // Dasharray calculation for SVG progress circle (Circumference is 100)
  const dashArrayValue = Math.round((ownedCount / totalCount) * 100);

  return (
    <div id={`team-sheet-${team.code}`} className="flex flex-col gap-8 duration-200 animate-fadeIn relative z-10 select-none">
      
      {/* Back to overview anchor */}
      <button 
        id="back-to-teams-btn"
        onClick={onBack}
        className="flex items-center gap-2 text-primary font-label-bold text-sm bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl border border-outline-variant w-fit active:scale-95 transition-all cursor-pointer leading-none"
      >
        <ArrowLeft className="w-4 h-4 text-primary" />
        Back to Teams sheet
      </button>

      {/* Team Header Bento Cards matching image #2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Dynamic banner with country identities */}
        <div id="team-banner-card" className="md:col-span-2 bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant relative overflow-hidden flex flex-col justify-between min-h-[170px]">
          {/* Decorative Stadium Wallpaper backdrop */}
          <div className="absolute inset-0 opacity-15 bg-no-repeat bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80')` }} />
          
          <div className="relative z-10 flex items-start gap-5">
            <span className="text-6xl md:text-5-xl shrink-0 p-1.5 bg-white rounded-2xl shadow-sm border border-outline-variant leading-none" role="img" aria-label={team.name}>
              {team.flagEmoji}
            </span>
            <div className="min-w-0">
              <span className="font-label-bold text-xs text-secondary-container bg-secondary/80 px-3 py-1 rounded-full inline-block mb-2 font-black tracking-wider uppercase">
                {team.group}
              </span>
              <h2 className="font-display-lg text-headline-lg sm:text-[40px] font-black leading-none m-0 tracking-tight uppercase break-words text-on-surface">
                {team.name}
              </h2>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center p-0.5 border border-outline-variant shadow-inner scale-95 shrink-0">
              <Shield className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <span className="font-label-bold text-sm text-on-surface-variant truncate font-black">
              {team.fedName}
            </span>
          </div>
        </div>

        {/* Progress Circle Card gauge from image #2 */}
        <div id="team-radial-progress" className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant flex flex-col justify-center items-center text-center">
          <h3 className="font-headline-md text-sm font-bold text-on-surface-variant mb-2 uppercase tracking-wide">Team Progress</h3>
          
          {/* Circular Progress Gauge */}
          <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Neutral background circle */}
              <circle 
                cx="18" 
                cy="18" 
                r="15.915" 
                fill="none" 
                stroke="#f4f2fd" 
                strokeWidth="3.2" 
              />
              {/* Dynamic progress circle */}
              <circle 
                cx="18" 
                cy="18" 
                r="15.915" 
                fill="none" 
                stroke="#446900" /* Secondary Trophy Green */
                strokeWidth="3.2" 
                strokeDasharray={`${dashArrayValue} 100`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            <div className="absolute flex flex-col items-center select-all">
              <span className="font-display-lg text-3xl font-bold text-on-surface leading-none">{ownedCount}</span>
              <span className="text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider mt-1">/ {totalCount}</span>
            </div>
          </div>

          <p className="font-body-md text-xs font-bold text-on-surface-variant leading-relaxed">
            {neededCount === 0 
              ? "🎉 Roster Section Complete!" 
              : `${neededCount} Stickers Needed to finish`}
          </p>
        </div>
      </div>

      {/* Squad Roster grid containing the 20 interactive cards */}
      <div className="bg-surface-container-lowest p-5 md:p-8 rounded-3xl border border-outline-variant shadow-sm">
        <div className="flex justify-between items-end mb-6 pb-4 border-b border-outline-variant leading-none">
          <h3 className="font-display-lg text-lg sm:text-2xl font-black text-on-surface uppercase tracking-tight">Roster Ranks</h3>
          <div className="flex gap-2.5">
            <span className="inline-flex items-center gap-1 font-label-bold text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary block" /> Owned
            </span>
            <span className="inline-flex items-center gap-1 font-label-bold text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-outline block" /> Missing
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {squadStickers.map((sticker) => {
            const count = collection.counts[sticker.id] || 0;
            const hasIt = count > 0;
            const isShiny = sticker.isShiny;

            return (
              <div 
                id={`squad-sticker-slot-${sticker.id}`}
                key={sticker.id}
                onClick={() => setSelectedSticker(sticker)}
                className={`aspect-[3/4] rounded-2xl relative flex flex-col p-2 group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden select-none ${
                  hasIt 
                    ? isShiny 
                      ? 'bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-tertiary-fixed shadow-md' 
                      : 'bg-white border border-outline-variant shadow-sm'
                    : 'bg-surface-container-low border border-dashed border-outline-variant opacity-65'
                }`}
              >
                {/* Shiny metallic reflection backdrop overlay */}
                {hasIt && isShiny && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-20 -translate-x-full group-hover:animate-shimmer pointer-events-none z-10" 
                       style={{ animationDuration: '2.5s' }} />
                )}

                {/* Sticker Code ID */}
                <div className={`absolute top-2 right-2 rounded px-1.5 py-0.5 text-[9px] font-label-bold tracking-widest z-10 uppercase ${
                  hasIt 
                    ? isShiny 
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold' 
                      : 'bg-surface-container-highest text-on-surface-variant'
                    : 'text-outline font-bold'
                }`}>
                  {sticker.id}
                </div>

                {/* Duplicates count */}
                {count > 1 && (
                  <div className="absolute -top-1 -right-1 bg-tertiary-container text-on-tertiary-container w-7 h-7 rounded-full flex items-center justify-center font-label-bold text-xs ring-2 ring-white shadow-md z-20 animate-wiggle">
                    +{count - 1}
                  </div>
                )}

                {/* Card Portrait Box */}
                <div className={`flex-grow w-full relative rounded-xl overflow-hidden mb-2.5 transition-all outline outline-1 outline-offset-1 shrink-0 ${
                  hasIt 
                    ? isShiny 
                      ? 'bg-surface-container-high outline-amber-200/50' 
                      : 'bg-surface-container-low outline-outline-variant/30'
                    : 'bg-surface-container-high outline-dashed outline-outline-variant/30'
                }`}>
                  {collection.photos?.[sticker.id] ? (
                    <img 
                      src={collection.photos[sticker.id]} 
                      alt={sticker.name}
                      className="w-full h-full object-cover object-top select-none"
                    />
                  ) : hasIt ? (
                    <div className="w-full h-full relative">
                      <img 
                        alt="" 
                        className={`w-full h-full object-cover object-top select-none ${
                          isShiny ? 'contrast-[1.12] saturate-[1.2]' : ''
                        }`}
                        src={
                          isShiny 
                            ? `https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=70&h=180` // Golden sheen
                            : `https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=70&h=180` // Pitch green illumination
                        } 
                      />
                      {isShiny && (
                        <div className="absolute top-2 left-2 animate-pulse">
                          <Sparkles className="w-4 h-4 text-tertiary-fixed-dim" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-outline">
                      <div className="opacity-35">
                        {sticker.position === 'Emblem' ? <Shield className="w-10 h-10" /> : sticker.position === 'Team Photo' ? <Users className="w-10 h-10" /> : <User className="w-10 h-10" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Labels description Footer inside card */}
                <div className="text-center pb-0.5 mt-auto relative z-10 truncate">
                  {hasIt ? (
                    <>
                      <div className={`font-label-bold text-xs truncate leading-none ${isShiny ? 'text-tertiary font-black' : 'text-on-surface'}`}>
                        {sticker.name}
                      </div>
                      <div className="text-[10px] text-on-surface-variant font-body-md uppercase tracking-wider mt-1 font-bold">
                        {sticker.position}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-label-bold text-xs text-outline font-extrabold tracking-wide uppercase">
                        {sticker.name.split(' ')[0]}
                      </div>
                      <div className="text-[10px] text-outline opacity-75 font-body-md uppercase tracking-wider mt-0.5">
                        {sticker.position}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EDIT OVERLAY SLIDEUP MODAL FOR CELL SELECTION */}
      {selectedSticker && (
        <div 
          id="sticker-quick-cell-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedSticker(null)}
        >
          <div 
            className="bg-surface rounded-3xl max-w-sm w-full p-6 border border-outline-variant shadow-2xl relative select-none animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Holographic light background */}
            <div className={`absolute -top-12 -left-12 -right-12 h-40 rounded-full opacity-10 blur-3xl ${
              selectedSticker.isShiny ? 'bg-tertiary animate-pulse' : 'bg-primary'
            }`} />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-label-bold tracking-widest uppercase ${
                  selectedSticker.isShiny ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-variant text-on-surface-variant'
                }`}>
                  {selectedSticker.id}
                </span>
                <span className="ml-2 font-label-bold text-xs text-outline bg-surface-container px-2 py-0.5 rounded">
                  {selectedSticker.position}
                </span>
              </div>
              <button 
                onClick={() => setSelectedSticker(null)}
                className="text-on-surface-variant hover:text-on-surface rounded-full p-1 hover:bg-surface-variant transition-colors"
              >
                <X className="w-5 h-5 block" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4 relative z-10 text-center">
              <div className={`w-36 aspect-[3/4] rounded-2xl p-1 shadow-xl flex flex-col justify-between align-center items-center ${
                selectedSticker.isShiny ? 'bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-tertiary-fixed' : 'bg-surface-container-lowest border border-outline-variant'
              }`}>
                <div className="w-full relative flex-grow rounded-xl overflow-hidden bg-surface-container-high flex items-center justify-center">
                  {collection.photos?.[selectedSticker.id] ? (
                    <img 
                      src={collection.photos[selectedSticker.id]} 
                      alt={selectedSticker.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (collection.counts[selectedSticker.id] || 0) > 0 ? (
                    <img 
                      alt="" 
                      className="w-full h-full object-cover" 
                      src={
                        selectedSticker.isShiny 
                          ? `https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=70&h=180`
                          : `https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=70&h=180`
                      } 
                    />
                  ) : (
                    <div className="text-outline opacity-40">
                      {selectedSticker.position === 'Emblem' ? <Shield className="w-10 h-10" /> : selectedSticker.position === 'Team Photo' ? <Users className="w-10 h-10" /> : <User className="w-10 h-10" />}
                    </div>
                  )}
                </div>
                <div className="text-center py-2.5 px-1 w-full shrink-0 select-none">
                  <p className={`font-label-bold text-xs truncate leading-none ${selectedSticker.isShiny ? 'text-tertiary' : 'text-on-surface'}`}>
                    {selectedSticker.name}
                  </p>
                  <p className="text-[9px] text-outline uppercase tracking-wider font-bold mt-1 font-mono">
                    {selectedSticker.section}
                  </p>
                </div>
              </div>

              <div className="w-full">
                <h4 className="font-headline-md text-base font-bold text-on-surface">{selectedSticker.name}</h4>
                <p className="font-body-md text-xs text-on-surface-variant max-w-xs mx-auto mt-1 leading-relaxed">
                  {selectedSticker.isShiny ? 'Special team metallic logo.' : 'Official team athlete profile sticker.'}
                  {(collection.counts[selectedSticker.id] || 0) > 0 
                    ? ` You own ${collection.counts[selectedSticker.id]} of this sticker.` 
                    : ' You are missing this sticker. Tap the increment (+) controller to acquire.'}
                </p>
              </div>

              {/* Photo Capture input & logic for owned stickers */}
              {(collection.counts[selectedSticker.id] || 0) > 0 && (
                <button
                  className="flex items-center gap-2 text-xs font-label-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-all cursor-pointer"
                  onClick={async () => {
                    try {
                      const image = await Camera.getPhoto({
                        quality: 90,
                        allowEditing: false,
                        resultType: CameraResultType.DataUrl
                      });
                      if (image.dataUrl) {
                        saveStickerPhoto(selectedSticker.id, image.dataUrl);
                      }
                    } catch (e) {
                      console.log('Skipped taking picture', e);
                    }
                  }}
                >
                  <CameraIcon className="w-4 h-4" />
                  {collection.photos?.[selectedSticker.id] ? "Change Sticker Photo" : "Take Sticker Photo"}
                </button>
              )}

              {/* Adjusters */}
              <div className="flex items-center gap-6 mt-2 relative z-10 w-full justify-center">
                <button 
                  id="sticker-quick-dec"
                  disabled={(collection.counts[selectedSticker.id] || 0) <= 0}
                  onClick={() => {
                    const comment = window.prompt("Reason for manual inventory reduction (required):");
                    if (comment) {
                      updateStickerCount(selectedSticker.id, -1, comment);
                    }
                  }}
                  className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center bg-surface hover:bg-surface-variant transition-colors disabled:opacity-40 select-none active:scale-90"
                >
                  <Minus className="w-4 h-4 text-on-surface" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="font-headline-lg text-3xl font-black text-on-surface">
                    {collection.counts[selectedSticker.id] || 0}
                  </span>
                  <span className="text-[10px] text-outline font-label-bold uppercase tracking-wider mt-0.5">Owned</span>
                </div>
                <button 
                  id="sticker-quick-inc"
                  onClick={() => {
                    if ((collection.counts[selectedSticker.id] || 0) === 0) {
                      if (window.confirm("Are you sure you want to stick this sticker?")) {
                        updateStickerCount(selectedSticker.id, 1);
                      }
                    } else {
                      updateStickerCount(selectedSticker.id, 1);
                    }
                  }}
                  className="w-12 h-12 rounded-full border-none flex items-center justify-center bg-primary hover:bg-surface-tint text-on-primary transition-colors select-none active:scale-90 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Direct ownership logic */}
              {(collection.counts[selectedSticker.id] || 0) === 0 && (
                <div className="flex flex-col gap-2 w-full mt-2">
                  <button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to stick this sticker?")) {
                        updateStickerCount(selectedSticker.id, 1);
                      }
                    }}
                    className="w-full bg-primary text-on-primary py-3 rounded-full font-label-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 select-none"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Stick!
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
