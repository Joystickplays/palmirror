'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { PLMSecureContext } from '@/context/PLMSecureContext';

// Toggle debugging logs
const DEBUG = true;

// --- Types ---
interface CharHistory {
  firstSeen: number;
  lastChattedAt?: number;
  totalChats: number;
  tags: string[];
  liked?: boolean;
  blocked?: boolean;
}
type TagScores = Record<string, { score: number; lastSeen: number }>;

type RecContextType = {
  setCharacterTags: (charId: string, tags: string[]) => void;
  recVisit: (charId: string) => void;
  recChattedAt: (charId: string, timestamp: number) => void;
  recUserExplicitLike: (charId: string) => void;
  recUserExplicitBlock: (tagOrCharId: string) => void;
  resetPersonalization: () => void;
  getRecommendedTags: (count?: number) => string[];
  getExcludedTags: (count?: number) => string[];
  buildRecommendationQuery: () => { include: string[]; exclude: string[] };
};

const RecContext = createContext<RecContextType | undefined>(undefined);

export const RecProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const secure = useContext(PLMSecureContext!);
  const [tagScores, setTagScores] = useState<TagScores>({});
  const [tagDislikes, setTagDislikes] = useState<TagScores>({});
  const [charHistory, setCharHistory] = useState<Record<string, CharHistory>>({});

  // Load persisted data on secure context ready
  useEffect(() => {
    if (!secure.isSecureReady()) return;
    if (DEBUG) console.debug('[Rec] Loading persisted recommendation data');
    Promise.all([
      secure.getSecureData('recTagScores'),
      secure.getSecureData('recDislikedTags'),
      secure.getSecureData('recCharHistory'),
    ]).then(([savedTags, savedDislikes, savedHistory]) => {
      if (savedTags) setTagScores(savedTags);
      if (savedDislikes) setTagDislikes(savedDislikes);
      if (savedHistory) setCharHistory(savedHistory);
      if (DEBUG) console.debug('[Rec] Loaded:', { savedTags, savedDislikes, savedHistory });
    });
  }, [secure]);

  // Persist helper
  const persist = useCallback(
    (key: string, data: any) => {
      if (!secure.isSecureReady()) return;
      if (DEBUG) console.debug(`[Rec] Persisting ${key}`, data);
      secure.setSecureData(key, data);
    },
    [secure]
  );

  // Utility to apply decay
  const decayScore = (entry: { score: number; lastSeen: number }) => {
    const days = (Date.now() - entry.lastSeen) / (1000 * 60 * 60 * 24);
    return entry.score * Math.exp(-0.1 * days);
  };

  // --- Core Methods ---
  const setCharacterTags = useCallback(
    (charId: string, tags: string[]) => {
      const pick = tags.sort(() => 0.5 - Math.random()).slice(0, 5);
      if (DEBUG) console.debug('[Rec] setCharacterTags', charId, pick);
      setTagScores(prev => {
        const next = { ...prev };
        pick.forEach(tag => {
          const prevEntry = next[tag] || { score: 0, lastSeen: 0 };
          const newScore = prevEntry.score + 1;
          next[tag] = { score: newScore, lastSeen: Date.now() };
        });
        persist('recTagScores', next);
        return next;
      });
    },
    [persist]
  );

  const recVisit = useCallback(
    (charId: string) => {
      const now = Date.now();
      if (DEBUG) console.debug('[Rec] recVisit', charId, now);
      setCharHistory(prev => {
        const existing = prev[charId];
        const nextHistory = {
          ...prev,
          [charId]: existing
            ? { ...existing }
            : { firstSeen: now, totalChats: 0, tags: [] },
        };
        persist('recCharHistory', nextHistory);
        return nextHistory;
      });
    },
    [persist]
  );

  const recChattedAt = useCallback(
    (charId: string, timestamp: number) => {
      if (DEBUG) console.debug('[Rec] recChattedAt', charId, timestamp);
      setCharHistory(prev => {
        const existing = prev[charId] || { firstSeen: timestamp, totalChats: 0, tags: [] };
        const next = {
          ...prev,
          [charId]: {
            ...existing,
            lastChattedAt: timestamp,
            totalChats: existing.totalChats + 1,
          },
        };
        persist('recCharHistory', next);
        return next;
      });
    },
    [persist]
  );

  const recUserExplicitLike = useCallback(
    (charId: string) => {
      if (DEBUG) console.debug('[Rec] recUserExplicitLike', charId);
      setCharHistory(prev => {
        const existing = prev[charId] || { firstSeen: Date.now(), totalChats: 0, tags: [] };
        const next = { ...prev, [charId]: { ...existing, liked: true } };
        persist('recCharHistory', next);
        return next;
      });
    },
    [persist]
  );

  const recUserExplicitBlock = useCallback(
    (tagOrCharId: string) => {
      if (DEBUG) console.debug('[Rec] recUserExplicitBlock', tagOrCharId);
      setTagDislikes(prev => {
        const entry = prev[tagOrCharId] || { score: 0, lastSeen: 0 };
        const nextEntry = { score: entry.score + 5, lastSeen: Date.now() };
        const next = { ...prev, [tagOrCharId]: nextEntry };
        persist('recDislikedTags', next);
        return next;
      });
    },
    [persist]
  );

  const resetPersonalization = useCallback(() => {
    if (DEBUG) console.debug('[Rec] resetPersonalization');
    setTagScores({});
    setTagDislikes({});
    setCharHistory({});
    secure.removeKey('recTagScores');
    secure.removeKey('recDislikedTags');
    secure.removeKey('recCharHistory');
  }, [secure]);

  const getRecommendedTags = useCallback(
    (count: number = 5) => {
      const recs = Object.entries(tagScores)
        .map(([tag, entry]) => ({ tag, score: decayScore(entry) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(x => x.tag);
      if (DEBUG) console.debug('[Rec] getRecommendedTags', recs);
      return recs;
    },
    [tagScores]
  );

  const getExcludedTags = useCallback(
    (count: number = 5) => {
      const excl = Object.entries(tagDislikes)
        .map(([tag, entry]) => ({ tag, score: decayScore(entry) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(x => x.tag);
      if (DEBUG) console.debug('[Rec] getExcludedTags', excl);
      return excl;
    },
    [tagDislikes]
  );

  const buildRecommendationQuery = useCallback(() => {
    const include = getRecommendedTags();
    const exclude = getExcludedTags();
    if (DEBUG) console.debug('[Rec] buildRecommendationQuery', { include, exclude });
    return { include, exclude };
  }, [getRecommendedTags, getExcludedTags]);

  // --- Expose ---
  const value: RecContextType = {
    setCharacterTags,
    recVisit,
    recChattedAt,
    recUserExplicitLike,
    recUserExplicitBlock,
    resetPersonalization,
    getRecommendedTags,
    getExcludedTags,
    buildRecommendationQuery,
  };

  return <RecContext.Provider value={value}>{children}</RecContext.Provider>;
};

// Hook for easy access
export const usePalRec = (): RecContextType => {
  const ctx = useContext(RecContext);
  if (!ctx) throw new Error('usePalRec must be inside RecProvider');
  return ctx;
};
