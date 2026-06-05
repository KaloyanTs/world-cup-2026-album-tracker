/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CollectionState, Sticker, Team } from '../types';
import { TEAMS } from '../data';
import { Search, ChevronDown, Award, Sparkles, Filter, Shield, Plus, Minus, Check, Users, User, X, Copy, ClipboardCheck, AlertCircle } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';

interface MyAlbumViewProps {
  collection: CollectionState;
  allStickers: Sticker[];
  updateStickerCount: (stickerId: string, delta: number, comment?: string) => void;
  openTeamDetails: (teamCode: string) => void;
}

export function MyAlbumView({
  collection,
  allStickers,
  updateStickerCount,
  openTeamDetails
}: MyAlbumViewProps) {
  // Filters
  const [selectedSection, setSelectedSection] = useState<string>('All'); // 'All', 'Opening', 'History', or Team Codes
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<string>('Album Order');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Sticker for quick adjust modal
  const [selectedStickerDetail, setSelectedStickerDetail] = useState<Sticker | null>(null);
  const [stickerToRemove, setStickerToRemove] = useState<Sticker | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Computed sections options
  const teamsMap = useMemo(() => {
    const map = new Map<string, Team>();
    for (const t of TEAMS) {
      map.set(t.code, t);
    }
    return map;
  }, []);

  // Filter stickers
  const filteredStickers = useMemo(() => {
    let list = allStickers;

    // Search query — supports comma-separated IDs with union semantics
    if (searchQuery.trim()) {
      const rawTerms = searchQuery.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (rawTerms.length > 0) {
        const matchedIds = new Set<string>();
        rawTerms.forEach(term => {
          allStickers.forEach(s => {
            if (
              s.id.toLowerCase().includes(term) ||
              s.name.toLowerCase().includes(term) ||
              s.section.toLowerCase().includes(term)
            ) {
              matchedIds.add(s.id);
            }
          });
        });
        list = list.filter(s => matchedIds.has(s.id));
      }
    }

    // Section Category
    if (selectedSection !== 'All') {
      if (selectedSection === 'Opening') {
        list = list.filter(s => s.type === 'general');
      } else if (selectedSection === 'History') {
        list = list.filter(s => s.type === 'history');
      } else {
        // Team code
        list = list.filter(s => s.teamCode === selectedSection);
      }
    }

    // Group
    if (selectedGroup !== 'All') {
      list = list.filter(s => {
        if (s.teamCode) {
          return teamsMap.get(s.teamCode)?.group === selectedGroup;
        }
        return false;
      });
    }

    // Position / Type
    if (selectedPosition !== 'All') {
      if (selectedPosition === 'GK') list = list.filter(s => s.position === 'GK');
      else if (selectedPosition === 'DF') list = list.filter(s => s.position === 'DF');
      else if (selectedPosition === 'MF') list = list.filter(s => s.position === 'MF');
      else if (selectedPosition === 'FW') list = list.filter(s => s.position === 'FW');
      else if (selectedPosition === 'Emblem') list = list.filter(s => s.position === 'Emblem');
      else if (selectedPosition === 'Team Photo') list = list.filter(s => s.position === 'Team Photo');
      else if (selectedPosition === 'Special') list = list.filter(s => s.position === 'Special');
    }

    // Apply sorting
    const sorted = [...list];
    if (selectedSort === 'Most Repeats') {
      sorted.sort((a, b) => {
        const aCount = collection.counts[a.id] || 0;
        const bCount = collection.counts[b.id] || 0;
        return bCount - aCount; // Descending duplicates
      });
    } else if (selectedSort === 'Most Needed') {
      sorted.sort((a, b) => {
        const aCount = (collection.counts[a.id] || 0) === 0 ? 1 : 0;
        const bCount = (collection.counts[b.id] || 0) === 0 ? 1 : 0;
        return bCount - aCount; // Gaps first
      });
    } else {
      // Album Order (Default ID order is FWC-1 -> FWC-19 etc but let's make sure it's sorted)
      // Custom natural sort helper
      sorted.sort((a, b) => {
        const typeOrder = { 'general': 0, 'team': 1, 'history': 2 };
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        // Match digits or parts
        if (a.teamCode && b.teamCode && a.teamCode !== b.teamCode) {
          return a.teamCode.localeCompare(b.teamCode);
        }
        return a.number - b.number;
      });
    }

    return sorted;
  }, [allStickers, selectedSection, selectedGroup, selectedPosition, selectedSort, searchQuery, collection, teamsMap]);

  // Group filtered stickers by section to make headings look beautiful like design #5
  const groupedStickers = useMemo(() => {
    const list: Array<{ name: string; code?: string; stickers: Sticker[] }> = [];
    const sectionsSeen = new Map<string, Sticker[]>();

    for (const s of filteredStickers) {
      if (!sectionsSeen.has(s.section)) {
        sectionsSeen.set(s.section, []);
      }
      sectionsSeen.get(s.section)!.push(s);
    }

    sectionsSeen.forEach((stickers, name) => {
      // Match with team code
      const firstWithTeam = stickers.find(s => s.teamCode);
      list.push({
        name,
        code: firstWithTeam?.teamCode,
        stickers
      });
    });

    return list;
  }, [filteredStickers]);

  // Calculate unique section completion
  const getSectionStats = (stickers: Sticker[]) => {
    const total = stickers.length;
    const owned = stickers.filter(s => (collection.counts[s.id] || 0) > 0).length;
    const percentage = Math.round((owned / total) * 100) || 0;
    return { total, owned, percentage };
  };

  return (
    <div id="my-album-tab" className="relative w-full flex-grow">
      {/* Background World Cup Watermark */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <span className="font-headline-lg font-black text-[35vw] leading-none text-primary transform -rotate-12 select-none select-none">
          26
        </span>
      </div>

      <div className="relative z-10 w-full flex flex-col gap-4">
        {/* Responsive Filters Bar matching design #5 */}
        <div id="filters-container" className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between sticky top-16 z-30 shadow-sm backdrop-blur-md bg-opacity-95">
          <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto">
            {/* Country Selector Dropdown */}
            <div className="relative col-span-2 md:col-auto">
              <select 
                id="filter-section-dropdown"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="appearance-none w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-4 pr-10 h-11 font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Opening">General & Hosts</option>
                <option value="History">WC History Section</option>
                <optgroup label="FIFA Groups Teams">
                  {TEAMS.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.flagEmoji} {t.name} ({t.code})
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Position Selector Dropdown */}
            <div className="relative">
              <select 
                id="filter-position-dropdown"
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="appearance-none w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-4 pr-10 h-11 font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value="All">All Positions</option>
                <option value="Emblem">Badge / Emblem</option>
                <option value="GK">Goalkeeper (GK)</option>
                <option value="DF">Defender (DF)</option>
                <option value="MF">Midfielder (MF)</option>
                <option value="FW">Forward (FW)</option>
                <option value="Team Photo">Team Photo</option>
                <option value="Special">General / Logo</option>
              </select>
              <ChevronDown className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Group Selector Dropdown */}
            <div className="relative">
              <select 
                id="filter-group-dropdown"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="appearance-none w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-4 pr-10 h-11 font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value="All">All Groups</option>
                {Array.from(new Set(TEAMS.map(t => t.group))).sort().map(grp => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0 flex-wrap">
            {/* Search query box */}
            <div className="relative flex-1 md:w-80 min-w-[200px]">
              <input 
                id="search-stickers-input"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCopiedToClipboard(false); }}
                className="w-full pl-9 pr-10 h-11 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Search or comma-separated IDs..."
                type="text"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              {/* Clear search button */}
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => { setSearchQuery(''); setCopiedToClipboard(false); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-all"
                  title="Clear search"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Copy results names to clipboard */}
            {searchQuery.trim() && filteredStickers.length > 0 && (
              <button
                id="copy-results-btn"
                onClick={async () => {
                  const names = filteredStickers.map(s => {
                    const prefix = s.teamCode || (s.id === '00' ? '00' : 'FWC');
                    if (s.position === 'Team Photo') return `${prefix} Team Photo`;
                    return `${prefix} ${s.name}`;
                  }).join(', ');
                  try {
                    await Clipboard.write({ string: names });
                    setCopiedToClipboard(true);
                    setTimeout(() => setCopiedToClipboard(false), 2500);
                  } catch {
                    // Fallback for web
                    try {
                      await navigator.clipboard.writeText(names);
                      setCopiedToClipboard(true);
                      setTimeout(() => setCopiedToClipboard(false), 2500);
                    } catch (e) {
                      console.error('Clipboard write failed', e);
                    }
                  }
                }}
                className={`h-11 px-4 rounded-xl font-label-bold text-sm flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap border ${
                  copiedToClipboard
                    ? 'bg-secondary-container text-on-secondary-container border-secondary/30'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-variant'
                }`}
                title="Copy result names to clipboard"
                type="button"
              >
                {copiedToClipboard ? (
                  <><ClipboardCheck className="w-4 h-4 text-secondary" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Names</>
                )}
              </button>
            )}

            {/* Sort Order dropdown */}
            <div className="relative">
              <select 
                id="sort-stickers-dropdown"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="appearance-none w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-4 pr-10 h-11 font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value="Album Order">Sort: Album Order</option>
                <option value="Most Repeats">Sort: Most Repeats</option>
                <option value="Most Needed">Sort: Most Needed</option>
              </select>
              <Filter className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Dynamic album segments based on grouped listing */}
        <div id="album-sections-scroll" className="flex flex-col gap-12 w-full">
          {groupedStickers.length === 0 ? (
            <div className="bg-surface-container-lowest p-12 rounded-3xl border border-outline-variant text-center flex flex-col items-center justify-center">
              
              <h3 className="font-headline-md text-lg text-on-surface">No matching stickers found</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mt-1 mb-4 font-body-md">
                Try loosening your category dropdown or position filters to reveal the album pages.
              </p>
              <button 
                onClick={() => {
                  setSelectedSection('All');
                  setSelectedPosition('All');
                  setSelectedGroup('All');
                  setSearchQuery('');
                }}
                className="bg-primary hover:bg-surface-tint text-on-primary text-xs font-label-bold py-2.5 px-6 rounded-full active:scale-95 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            groupedStickers.map((section) => {
              const { total, owned, percentage } = getSectionStats(section.stickers);
              const teamInfo = section.code ? teamsMap.get(section.code) : null;

              return (
                <section 
                  id={`segment-${section.code || 'general'}`} 
                  key={section.name} 
                  className="bg-surface-container-lowest p-5 md:p-8 rounded-[28px] border border-outline-variant shadow-sm transition-all hover:shadow bg-white relative overflow-hidden"
                >
                  {/* Subtle team backdrop watermark */}
                  {teamInfo && (
                    <div className="absolute right-0 top-0 bottom-0 opacity-[0.03] select-none text-[14vw] font-black pointer-events-none leading-none pr-4 flex items-center">
                      {teamInfo.code}
                    </div>
                  )}

                  {/* Segment Headers */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-outline-variant pb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      {teamInfo ? (
                        <div 
                          className="flex items-center gap-3 cursor-pointer group hover:opacity-85"
                          onClick={() => openTeamDetails(teamInfo.code)}
                        >
                          <span className="text-4xl shadow-sm rounded p-1 bg-surface-container">{teamInfo.flagEmoji}</span>
                          <div>
                            <h3 className="font-headline-lg text-lg sm:text-2xl font-black text-on-surface group-hover:text-primary transition-colors inline-block tracking-tight">
                              {teamInfo.name.toUpperCase()}
                            </h3>
                            <span className="ml-2.5 px-2 py-0.5 bg-surface-container-highest rounded text-xs font-label-bold text-on-surface-variant uppercase tracking-wide">
                              {teamInfo.code}
                            </span>
                            <p className="text-xs text-on-surface-variant mt-0.5 font-body-md">
                              {teamInfo.fedName} • <span className="font-label-bold text-primary">{teamInfo.group}</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Award className="w-8 h-8 text-primary animate-pulse" />
                          <h3 className="font-headline-lg text-xl font-bold text-on-surface tracking-tight">
                            {section.name}
                          </h3>
                        </div>
                      )}
                    </div>

                    {/* Completion percentages progress badge */}
                    <div 
                      id={`prog-badge-${section.code || 'general'}`}
                      className="flex items-center gap-3 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full border border-secondary/30 shrink-0 select-none cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => teamInfo && openTeamDetails(teamInfo.code)}
                    >
                      <span className="font-label-bold text-sm">{percentage}%</span>
                      <div className="w-16 sm:w-24 h-2.5 bg-white/45 rounded-full overflow-hidden border border-outline-variant/20">
                        <div 
                          className="h-full bg-secondary rounded-full shadow-[0_0_6px_rgba(68,105,0,0.5)] transition-all duration-700" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-body-md whitespace-nowrap hidden sm:inline">({owned}/{total})</span>
                    </div>
                  </div>

                  {/* Sticker Display Grids - High Density, no photo space */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 relative z-10">
                    {section.stickers.map((sticker) => {
                      const count = collection.counts[sticker.id] || 0;
                      const hasIt = count > 0;
                      const isShiny = sticker.isShiny;

                      return (
                        <div 
                          id={`sticker-slot-${sticker.id}`}
                          key={sticker.id}
                          onClick={() => setSelectedStickerDetail(sticker)}
                          className={`rounded-xl relative flex flex-col p-3 group cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 select-none overflow-hidden ${
                            hasIt 
                              ? isShiny 
                                ? 'bg-gradient-to-b from-amber-50 to-amber-100 border border-tertiary-fixed shadow-sm dark:shadow-none' 
                                : 'bg-white border border-outline-variant/80 shadow-sm dark:shadow-none'
                              : 'bg-surface-container-low border border-dashed border-outline-variant/80 opacity-60'
                          }`}
                        >
                          {/* Shimmer Effect for Foil Shinies */}
                          {hasIt && isShiny && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-20 -translate-x-full group-hover:animate-shimmer pointer-events-none z-10" 
                                 style={{ animationDuration: '2.5s' }} />
                          )}

                          {/* Sticker Code Identifier */}
                          <div className="flex justify-between items-start mb-2 relative z-20">
                            <div className={`rounded px-1.5 py-0.5 text-[9px] font-label-bold tracking-wider uppercase ${
                              hasIt 
                                ? isShiny 
                                ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold' 
                                : 'bg-surface-container-highest text-on-surface-variant'
                                : 'text-outline'
                            }`}>
                              {sticker.id}
                            </div>

                            {/* Duplicate Count Mini Badge */}
                            {count > 1 && (
                              <div className="bg-tertiary-container text-on-tertiary-container px-1.5 py-0.5 rounded-full font-label-bold text-[9px] shadow-sm z-20 animate-wiggle">
                                +{count - 1}
                              </div>
                            )}
                          </div>

                          {/* Information Content */}
                          <div className="mt-auto relative z-10">
                            <div className={`font-label-bold text-[11px] truncate leading-tight mb-0.5 ${
                              hasIt 
                                ? isShiny ? 'text-tertiary font-black' : 'text-on-surface'
                                : 'text-outline font-extrabold opacity-60'
                            }`}>
                              {hasIt ? sticker.name : 'MISSING'}
                            </div>
                            <div className="text-[8px] text-on-surface-variant font-body-md uppercase tracking-widest font-bold opacity-70">
                              {sticker.position}
                            </div>
                          </div>

                          {/* Subtle background icon for type context without taking space */}
                          <div className="absolute -bottom-1 -right-1 opacity-[0.04] pointer-events-none">
                            {sticker.position === 'Emblem' ? <Shield className="w-12 h-12" /> : sticker.position === 'Team Photo' ? <Users className="w-12 h-12" /> : <User className="w-12 h-12" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>

      {/* WARNING MODAL FOR LAST COPY */}
      {stickerToRemove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setStickerToRemove(null)} />
          <div className="relative bg-error-container border-2 border-error rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-error" />
            </div>
            <h3 className="font-display-lg text-2xl font-black text-on-error-container mb-4 text-center">DANGER!</h3>
            <p className="font-body-md text-base text-on-error-container mb-8 text-center font-bold">
              You are about to remove your ONLY copy of this sticker! This will permanently leave your album slot empty.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const comment = window.prompt("Reason for manual inventory reduction (required):");
                  if (comment) {
                    updateStickerCount(stickerToRemove.id, -1, comment);
                  }
                  setStickerToRemove(null);
                }}
                className="flex items-center justify-center gap-3 w-full bg-error text-on-error py-4 rounded-2xl font-label-bold shadow-lg shadow-error/20 active:scale-95 transition-all"
              >
                Yes, Remove It
              </button>
              
              <button
                onClick={() => setStickerToRemove(null)}
                className="w-full text-center py-4 bg-surface-container-high text-on-surface rounded-2xl font-label-bold hover:bg-surface-variant transition-all mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADJUST STICKER MODAL OVERLAY */}
      {selectedStickerDetail && (
        <div 
          id="sticker-control-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedStickerDetail(null)}
        >
          <div 
            className="bg-surface rounded-3xl max-w-sm w-full p-6 border border-outline-variant shadow-2xl relative select-none animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Holographic light background */}
            <div className={`absolute -top-12 -left-12 -right-12 h-40 rounded-full opacity-10 blur-3xl ${
              selectedStickerDetail.isShiny ? 'bg-tertiary' : 'bg-primary'
            }`} />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-label-bold tracking-widest uppercase ${
                  selectedStickerDetail.isShiny ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-variant text-on-surface-variant'
                }`}>
                  {selectedStickerDetail.id}
                </span>
                <span className="ml-2 font-label-bold text-xs text-outline bg-surface-container px-2 py-0.5 rounded">
                  {selectedStickerDetail.position}
                </span>
              </div>
              <button 
                onClick={() => setSelectedStickerDetail(null)}
                className="text-on-surface-variant hover:text-on-surface rounded-full p-1 hover:bg-surface-variant transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4 relative z-10 text-center">
              <div className={`w-36 aspect-[3/4] rounded-2xl p-1 shadow-xl flex flex-col justify-between align-center items-center ${
                selectedStickerDetail.isShiny ? 'bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-tertiary-fixed' : 'bg-surface-container-lowest border border-outline-variant'
              }`}>
                <div className="w-full relative flex-grow rounded-xl overflow-hidden bg-surface-container-high flex items-center justify-center">
                  {(collection.counts[selectedStickerDetail.id] || 0) > 0 ? (
                    <div className={`flex justify-center mb-8 ${selectedStickerDetail.isShiny ? 'text-tertiary' : 'text-primary/60'}`}>
                      {selectedStickerDetail.position === 'Emblem' ? <Shield className="w-16 h-16" /> : selectedStickerDetail.position === 'Team Photo' ? <Users className="w-16 h-16" /> : <User className="w-16 h-16" />}
                    </div>
                  ) : (
                    <div className="text-outline-variant opacity-40">
                      {selectedStickerDetail.position === 'Emblem' ? <Shield className="w-10 h-10" /> : selectedStickerDetail.position === 'Team Photo' ? <Users className="w-10 h-10" /> : <User className="w-10 h-10" />}
                    </div>
                  )}
                </div>
                <div className="text-center py-2.5 px-1 w-full shrink-0 select-none">
                  <p className={`font-label-bold text-xs truncate leading-none ${selectedStickerDetail.isShiny ? 'text-tertiary' : 'text-on-surface'}`}>
                    {selectedStickerDetail.name}
                  </p>
                  <p className="text-[9px] text-outline uppercase tracking-wider font-bold mt-1 font-mono">
                    {selectedStickerDetail.section}
                  </p>
                </div>
              </div>

              <div className="w-full">
                <h4 className="font-headline-md text-base font-bold text-on-surface">{selectedStickerDetail.name}</h4>
                <p className="font-body-md text-xs text-on-surface-variant max-w-xs mx-auto mt-1 leading-relaxed">
                  {selectedStickerDetail.isShiny ? 'Special metallic foil collectible.' : 'Standard sticker collection card.'}
                  {(collection.counts[selectedStickerDetail.id] || 0) > 0 
                    ? ` You own ${collection.counts[selectedStickerDetail.id]} copies of this sticker.` 
                    : ' You do not own this sticker yet. Mark as collected below.'}
                </p>
              </div>

              {/* Counts Increment / Decrement controls */}
              <div className="flex items-center gap-6 mt-2 relative z-10 w-full justify-center">
                <button 
                  id="sticker-modal-dec"
                  disabled={(collection.counts[selectedStickerDetail.id] || 0) <= 0}
                  onClick={() => {
                    if ((collection.counts[selectedStickerDetail.id] || 0) === 1) {
                      setStickerToRemove(selectedStickerDetail);
                    } else {
                      const comment = window.prompt("Reason for manual inventory reduction (required):");
                      if (comment) {
                        updateStickerCount(selectedStickerDetail.id, -1, comment);
                      }
                    }
                  }}
                  className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center bg-surface hover:bg-surface-variant transition-colors disabled:opacity-40 select-none active:scale-90"
                >
                  <Minus className="w-4 h-4 text-on-surface" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="font-headline-lg text-3xl font-black text-on-surface">
                    {collection.counts[selectedStickerDetail.id] || 0}
                  </span>
                  <span className="text-[10px] text-outline font-label-bold uppercase tracking-wider mt-0.5">Owned</span>
                </div>
                <button 
                  id="sticker-modal-inc"
                  onClick={() => {
                    if ((collection.counts[selectedStickerDetail.id] || 0) === 0) {
                      if (window.confirm("Are you sure you want to stick this sticker?")) {
                        updateStickerCount(selectedStickerDetail.id, 1);
                      }
                    } else {
                      updateStickerCount(selectedStickerDetail.id, 1);
                    }
                  }}
                  className="w-12 h-12 rounded-full border-none flex items-center justify-center bg-primary hover:bg-surface-tint text-on-primary transition-colors select-none active:scale-90 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Paste Into Album direct shortcut button */}
              {(collection.counts[selectedStickerDetail.id] || 0) === 0 && (
                <button 
                  id="sticker-modal-quick-own"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to stick this sticker?")) {
                      updateStickerCount(selectedStickerDetail.id, 1);
                    }
                  }}
                  className="w-full bg-secondary text-on-secondary py-3 rounded-full font-label-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 mt-2 select-none"
                >
                  <Check className="w-4 h-4" />
                  Strap In / Stick into Album!
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

