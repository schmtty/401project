import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ConnectionCard from '@/components/ConnectionCard';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { sampleConnections, sampleEvents, sampleGoals } from '@/utils/sampleData';
import type { Connection, CalendarEvent, Goal } from '@/utils/sampleData';

const ConnectionsPage = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useLocalStorage<Connection[]>('connections', sampleConnections);

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this connection?')) {
      setConnections(prev => prev.filter(c => c.id !== id));
    }
  };

  // Sort by most recent
  const sorted = [...connections].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const featured = sorted.filter(c => c.milestones.dates >= 2);

  return (
    <div className="mobile-container pb-24">
      <PageHeader
        title="Connections"
        rightAction={
          <button
            onClick={() => navigate('/connections/new')}
            className="tap-target flex items-center justify-center text-primary active-scale"
          >
            <Plus size={24} />
          </button>
        }
      />

      {featured.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-5 mb-2">
            <h2 className="text-section-title">Featured</h2>
            <button className="text-xs text-primary font-medium">Show all</button>
          </div>
          <FeaturedCarousel connections={featured} />
        </div>
      )}

      <div className="px-5">
        <h2 className="text-section-title mb-3">All Connections</h2>
        <div className="flex flex-col gap-2">
          {sorted.map(c => (
            <ConnectionCard key={c.id} connection={c} onDelete={handleDelete} />
          ))}
          {sorted.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No connections yet</p>
              <button onClick={() => navigate('/connections/new')} className="text-primary font-medium">
                Add your first connection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage;
