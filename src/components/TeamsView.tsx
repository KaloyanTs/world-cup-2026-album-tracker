/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CollectionState, Sticker, Team } from '../types';
import { TEAMS } from '../data';
import { Shield, Sparkles, ChevronRight, Search, Trophy, CheckSquare } from 'lucide-react';

interface TeamsViewProps {
  collection: CollectionState;
  allStickers: Sticker[];
  onSelectTeam: (teamCode: string) => void;
}

export function TeamsView({
  collection,
  allStickers,
  onSelectTeam
}: TeamsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Group teams by their official Groups A-L
  const groupedTeams = useMemo(() => {
    const groups: { [grp: string]: Team[] } = {};
    for (const t of TEAMS) {
      if (!groups[t.group]) groups[t.group] = [];
      groups[t.group].push(t);
    }

    // Filter based on search query
    const filteredGroups: { [grp: string]: Team[] } = {};
    Object.keys(groups).sort().forEach(grp => {
      const filtered = groups[grp].filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        filteredGroups[grp] = filtered;
      }
    });

    return filteredGroups;
  }, [searchQuery]);

  // Helper to compute team completion ratio
  const getTeamRatios = (teamCode: string) => {
    const teamStickers = allStickers.filter(s => s.teamCode === teamCode);
    const total = teamStickers.length; // Always 20
    const owned = teamStickers.filter(s => (collection.counts[s.id] || 0) > 0).length;
    const isBadgeOwned = (collection.counts[`${teamCode}-1`] || 0) > 0;
    const progressPercent = Math.round((owned / total) * 100);

    return { total, owned, isBadgeOwned, progressPercent };
  };

  // Global complete summaries
  const fullyCompletedTeamsCount = useMemo(() => {
    let count = 0;
    for (const t of TEAMS) {
      const stats = getTeamRatios(t.code);
      if (stats.owned === stats.total) {
        count++;
      }
    }
    return count;
  }, [collection, allStickers]);

  return (
    <div id="teams-tab" className="flex flex-col gap-8 duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-3xl font-bold text-primary mb-1">Teams & Groups</h2>
          <p className="text-on-surface-variant font-body-lg text-sm sm:text-base">
            Select any squad to view player stickers, check progress metrics, and stick roster items page-by-page.
          </p>
        </div>

        {/* Global Trophy counts badge */}
        <div className="flex items-center gap-3 bg-tertiary-container/30 border border-tertiary/20 text-on-tertiary-container px-4 py-2.5 rounded-2xl select-none select-none shrink-0">
          <Trophy className="w-5 h-5 text-tertiary-fixed-dim" />
          <div className="text-xs">
            <p className="font-label-bold font-black leading-none">{fullyCompletedTeamsCount} / 48</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Teams Fully Completed</p>
          </div>
        </div>
      </div>

      {/* Roster Search bar */}
      <div id="teams-search-bar" className="relative max-w-md w-full">
        <input 
          id="search-teams-query"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl font-body-md text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline"
          placeholder="Type country name or code (e.g. MEX, Brazil)..."
          type="text"
        />
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
      </div>

      {/* Collapsible/Bento blocks of Group collections */}
      <div className="flex flex-col gap-10">
        {Object.keys(groupedTeams).length === 0 ? (
          <div className="bg-surface-container-lowest p-12 rounded-3xl border border-dashed border-outline-variant text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2 opacity-40">flag_circle</span>
            <p className="font-label-bold text-sm text-outline">No teams match your search</p>
            <p className="text-xs text-outline mt-1 font-body-md">Try typing a simplified country name or check spelling.</p>
          </div>
        ) : (
          Object.keys(groupedTeams).map((groupName) => (
            <div id={`groupBlock-${groupName.replace(' ', '')}`} key={groupName} className="flex flex-col gap-4">
              <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2 border-l-4 border-primary pl-3">
                {groupName}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {groupedTeams[groupName].map((team) => {
                  const { total, owned, isBadgeOwned, progressPercent } = getTeamRatios(team.code);
                  const isFinished = owned === total;

                  return (
                    <div 
                      id={`team-card-${team.code}`}
                      key={team.code}
                      onClick={() => onSelectTeam(team.code)}
                      className={`group cursor-pointer rounded-2xl p-4 border transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-md flex flex-col justify-between ${
                        isFinished 
                          ? 'bg-gradient-to-br from-secondary-container/10 to-secondary-container/30 border-secondary' 
                          : 'bg-surface-container-lowest hover:border-primary border-outline-variant'
                      }`}
                    >
                      <div>
                        {/* Upper row: flag, badge state */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-3xl rounded bg-surface p-0.5 shadow-sm leading-none shrink-0" role="img" aria-label={team.name}>
                              {team.flagEmoji}
                            </span>
                            <div>
                              <h4 className="font-label-bold text-sm text-on-surface group-hover:text-primary transition-colors leading-none truncate max-w-[110px]" title={team.name}>
                                {team.name}
                              </h4>
                              <p className="text-[10px] text-on-surface-variant font-body-md mt-1 tracking-wider font-bold">
                                {team.code}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isBadgeOwned ? (
                              <div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-inner" title="Federation Badge Collected">
                                <Shield className="w-3 h-3 text-secondary animate-pulse" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-surface-container border border-dashed border-outline flex items-center justify-center" title="Badge Missing">
                                <Shield className="w-3 h-3 text-outline opacity-40" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mid Row: progression sliders */}
                        <div className="flex justify-between items-center text-xs font-label-bold text-on-surface-variant mb-1.5 select-none leading-none">
                          <span className={`${isFinished ? 'text-secondary font-black' : 'text-on-surface'}`}>
                            {owned} / {total} Stickers
                          </span>
                          <span>{progressPercent}%</span>
                        </div>
                      </div>

                      {/* Progression bar */}
                      <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden border border-outline-variant/10 relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            isFinished 
                              ? 'bg-gradient-to-r from-secondary to-secondary-container shadow-[0_0_6px_rgba(68,105,0,0.6)]' 
                              : 'bg-primary'
                          }`} 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {/* CTA Chevron indicator */}
                      <div className="flex justify-end items-center gap-1.5 text-[10px] font-label-bold text-primary dark:text-primary-fixed mt-3 group-hover:translate-x-1 transition-transform leading-none select-none">
                        Open Squad sheet
                        <ChevronRight className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
