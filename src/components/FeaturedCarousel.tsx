import type { Connection } from '@/utils/sampleData';
import { useNavigate } from 'react-router-dom';

interface FeaturedCarouselProps {
  connections: Connection[];
}

const FeaturedCarousel = ({ connections }: FeaturedCarouselProps) => {
  const navigate = useNavigate();
  const featured = connections.slice(0, 4);

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
      {featured.map((c) => (
        <button
          key={c.id}
          onClick={() => navigate(`/connections/${c.id}`)}
          className="shrink-0 w-20 flex flex-col items-center gap-1 active-scale"
        >
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-3xl shadow-sm">
            {c.avatar}
          </div>
          <span className="text-xs font-medium text-card-foreground truncate w-full text-center">{c.name.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  );
};

export default FeaturedCarousel;
