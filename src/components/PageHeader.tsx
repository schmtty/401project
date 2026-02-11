import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

const PageHeader = ({ title, showBack = false, rightAction }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 h-14">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => navigate(-1)} className="tap-target flex items-center justify-center active-scale">
              <ArrowLeft size={22} />
            </button>
          )}
          <h1 className="text-page-title">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {rightAction}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
