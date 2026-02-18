import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ConnectionCard from '@/components/ConnectionCard';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import { useConnections } from '@/hooks/useConnections';
import { useAddConnection } from '@/contexts/AddConnectionContext';

const ConnectionsPage = () => {
  const navigate = useNavigate();
  const { open: openAddConnection, openForEdit } = useAddConnection();
  const [connections, setConnections] = useConnections();

  const handleDelete = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
  };

  // Sort by most recent
  const sorted = [...connections].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const likedConnections = sorted.filter(c => c.liked);

  return (
    <div className="mobile-container pb-24">
      <PageHeader
        title="Connections"
        showBack
        rightAction={
          <button
            onClick={openAddConnection}
            className="tap-target flex items-center justify-center text-primary active-scale"
          >
            <Plus size={24} />
          </button>
        }
      />

      {likedConnections.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-5 mb-2">
            <h2 className="text-section-title">Liked Connections</h2>
          </div>
          <FeaturedCarousel connections={likedConnections} />
        </div>
      )}

      <div className="px-5">
        <h2 className="text-section-title mb-3">All Connections</h2>
        <div className="flex flex-col gap-2">
          {sorted.map(c => (
            <ConnectionCard key={c.id} connection={c} onEdit={openForEdit} onDelete={handleDelete} />
          ))}
          {sorted.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No connections yet</p>
              <button onClick={openAddConnection} className="text-primary font-medium">
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
