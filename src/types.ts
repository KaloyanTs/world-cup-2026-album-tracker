/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StickerType = 'general' | 'team' | 'history';

export interface Sticker {
  id: string; // "00", "FWC-1", "ARG-10"
  name: string; // player name or emblem role
  type: StickerType;
  section: string; // "General", "Argentina", "History"
  teamCode?: string; // "ARG", "USA", etc.
  number: number; // 0 for "00", 1..20 for team, 1..19 for FWC-1..19
  isShiny: boolean;
  position?: 'Emblem' | 'GK' | 'DF' | 'MF' | 'FW' | 'Team Photo' | 'Special';
}

export interface Team {
  name: string;
  code: string;
  group: string;
  flagEmoji: string;
  fedName: string;
}

export interface TradeOffer {
  id: string;
  traderName: string;
  traderAvatar?: string;
  gives: string[]; // sticker IDs trader gives you
  wants: string[]; // sticker IDs you give trader
  status: 'pending' | 'accepted' | 'declined' | 'pending_arrival';
}

export interface CollectionState {
  counts: { [stickerId: string]: number }; // stickerId -> owned count (0 = missing, 1 = owned, >1 has duplicates)
  photos?: { [stickerId: string]: string }; // stickerId -> photo URL (taken once)
}
