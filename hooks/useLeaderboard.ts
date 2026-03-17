import { useCallback, useEffect, useMemo, useState } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

export type LeaderboardUser = {
  id: string;
  username: string;
  xp: number;
  level: number;
  rank: number;
};

type ProfileRow = {
  id: string;
  username: string | null;
  xp: number | null;
  level: number | null;
};

const normalizeLeaderboard = (rows: ProfileRow[]): LeaderboardUser[] =>
  rows.map((row, index) => ({
    id: row.id,
    username: row.username ?? `user_${row.id.slice(-6)}`,
    xp: Number(row.xp ?? 0),
    level: Number(row.level ?? 1),
    rank: index + 1,
  }));

export const useLeaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, xp, level')
      .order('xp', { ascending: false })
      .order('level', { ascending: false })
      .limit(50);

    if (fetchError) {
      setError(fetchError.message);
      setLeaders([]);
      setLoading(false);
      return;
    }

    setLeaders(normalizeLeaderboard((data ?? []) as ProfileRow[]));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel('leaderboard-top-50')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (_payload: RealtimePostgresChangesPayload<ProfileRow>) => {
          fetchLeaderboard();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  return useMemo(() => ({ leaders, loading, error, refetch: fetchLeaderboard }), [leaders, loading, error, fetchLeaderboard]);
};
