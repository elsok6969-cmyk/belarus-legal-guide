import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UsageResult {
  allowed: boolean;
  used: number;
  limit: number | null;
  plan: string;
  isLoading: boolean;
}

export function useUsageLimit(feature: string): UsageResult {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['usage-limit', user?.id, feature],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_limit', {
        p_user_id: user!.id,
        p_feature: feature,
      });
      if (error) throw error;
      return data as unknown as { allowed: boolean; used: number; limit: number | null; plan: string };
    },
    enabled: !!user,
    staleTime: 30000,
  });

  if (!user) {
    return { allowed: false, used: 0, limit: 0, plan: 'free', isLoading: false };
  }

  return {
    allowed: data?.allowed ?? true,
    used: data?.used ?? 0,
    limit: data?.limit ?? null,
    plan: data?.plan ?? 'free',
    isLoading,
  };
}

export async function trackUsage(feature: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc('increment_usage', { p_user_id: user.id, p_feature: feature });
}
