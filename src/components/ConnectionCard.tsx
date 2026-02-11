import { useNavigate } from 'react-router-dom';
import { MoreVertical, Flame, Heart } from 'lucide-react';
import type { Connection } from '@/utils/sampleData';

interface ConnectionCardProps {
  connection: Connection;
  onDelete?: (id: string) => void;
}

const ConnectionCard = ({ connection, onDelete }: ConnectionCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className="card-ios p-4 flex items-center gap-3 active-scale cursor-pointer animate-slide-up"
      onClick={() => navigate(`/connections/${connection.id}`)}
    >
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl shrink-0">
        {connection.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-card-foreground truncate">{connection.name}</h3>
          {connection.milestones.contactStreak >= 7 && (
            <span className="flex items-center gap-0.5 text-warning text-xs">
              <Flame size={12} /> {connection.milestones.contactStreak}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{connection.notes}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onDelete) onDelete(connection.id);
        }}
        className="tap-target flex items-center justify-center text-muted-foreground"
      >
        <MoreVertical size={18} />
      </button>
    </div>
  );
};

export default ConnectionCard;
