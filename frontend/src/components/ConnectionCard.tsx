import { useNavigate } from 'react-router-dom';
import { MoreVertical, Flame, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import ConnectionAvatar from '@/components/ConnectionAvatar';
import type { Connection } from '@/utils/sampleData';

interface ConnectionCardProps {
  connection: Connection;
  onEdit?: (connection: Connection) => void;
  onDelete?: (id: string) => void;
}

const ConnectionCard = ({ connection, onEdit, onDelete }: ConnectionCardProps) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.(connection.id);
    setShowDeleteConfirm(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(connection);
  };

  return (
    <>
      <div
        className="card-ios p-4 flex items-center gap-3 active-scale cursor-pointer animate-slide-up gradient-card hover:shadow-md transition-shadow"
        onClick={() => navigate(`/connections/${connection.id}`)}
      >
        <ConnectionAvatar gender={connection.gender ?? 'male'} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-card-foreground truncate">{connection.name}</h3>
            {connection.liked && (
              <Heart size={14} className="fill-pink-500 text-pink-500 shrink-0" />
            )}
            {connection.milestones.contactStreak >= 7 && (
              <span className="flex items-center gap-0.5 text-warning text-xs">
                <Flame size={12} /> {connection.milestones.contactStreak}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{connection.notes}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="tap-target flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <MoreVertical size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={handleEditClick}>
              <Pencil size={14} className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive focus:text-destructive">
              <Trash2 size={14} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete connection?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {connection.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConnectionCard;
