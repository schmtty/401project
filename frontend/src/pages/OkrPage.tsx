import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const POLL_INTERVAL_MS = 5000;

const OkrPage = () => {
  useDocumentTitle('OKR');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['okr-average-connections-per-user'],
    queryFn: api.okr.getAverageConnectionsPerUser,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  return (
    <div className="mobile-container pb-24">
      <PageHeader title="OKR" showBack />
      <div className="page-padding space-y-4">
        <div className="card-ios p-5">
          <p className="text-sm text-muted-foreground mb-2">Average connections per user</p>
          {isLoading && (
            <p className="text-2xl font-bold text-foreground">Loading...</p>
          )}
          {isError && (
            <p className="text-sm text-destructive">
              {(error as Error)?.message || 'Failed to load OKR data'}
            </p>
          )}
          {!isLoading && !isError && (
            <p className="text-4xl font-bold text-foreground">
              {Number(data?.averageConnectionsPerUser ?? 0).toFixed(2)}
            </p>
          )}
        </div>

        <div className="card-ios p-4 space-y-1">
          <p className="text-sm text-muted-foreground">
            Total users: <span className="text-foreground font-medium">{data?.totalUsers ?? 0}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Total connections: <span className="text-foreground font-medium">{data?.totalConnections ?? 0}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Auto-refreshes every {POLL_INTERVAL_MS / 1000} seconds.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OkrPage;
