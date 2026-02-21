import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MapPin, Flame, Heart, HandMetal, Users, Calendar, Trash2, MoreVertical, Pencil } from 'lucide-react';
import ConnectionAvatar from '@/components/ConnectionAvatar';
import PageHeader from '@/components/PageHeader';
import { useConnections } from '@/hooks/useConnections';
import { useAddConnection } from '@/contexts/AddConnectionContext';
import { useEventModal } from '@/contexts/EventModalContext';
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

const ConnectionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openForEdit } = useAddConnection();
  const { events, openEvent } = useEventModal();
  const [connections, setConnections] = useConnections();
  const [editingNotes, setEditingNotes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const connection = connections.find(c => c.id === id);
  if (!connection) return <div className="mobile-container page-padding pt-20 text-center text-muted-foreground">Connection not found</div>;

  const connectionEvents = events.filter(e => e.connectionId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const updateMilestone = (key: string, value: any) => {
    setConnections(prev => prev.map(c =>
      c.id === id ? { ...c, milestones: { ...c.milestones, [key]: value } } : c
    ));
  };

  const updateNotes = (notes: string) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  };

  const handleDelete = () => {
    setConnections(prev => prev.filter(c => c.id !== id));
    setShowDeleteConfirm(false);
    navigate('/connections');
  };

  const milestoneItems = [
    { key: 'dates', label: 'Dates', icon: Calendar, value: connection.milestones.dates, type: 'number' as const },
    { key: 'heldHands', label: 'Held Hands', icon: HandMetal, value: connection.milestones.heldHands, type: 'toggle' as const },
    { key: 'kissed', label: 'Kissed', icon: Heart, value: connection.milestones.kissed, type: 'toggle' as const },
    { key: 'metParents', label: 'Met Parents', icon: Users, value: connection.milestones.metParents, type: 'toggle' as const },
    { key: 'contactStreak', label: 'Streak', icon: Flame, value: connection.milestones.contactStreak, type: 'number' as const },
  ];

  return (
    <div className="mobile-container pb-24">
      <PageHeader
        title=""
        showBack
        rightAction={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="tap-target flex items-center justify-center text-muted-foreground hover:text-foreground active-scale">
                <MoreVertical size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openForEdit(connection)}>
                <Pencil size={14} className="mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive focus:text-destructive">
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete connection?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {connection.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile header */}
      <div className="flex flex-col items-center py-4 animate-fade-in">
        <ConnectionAvatar gender={connection.gender ?? 'male'} size={96} className="rounded-3xl mb-3 shadow-sm" />
        <h2 className="text-xl font-bold text-foreground">{connection.name}</h2>
        <p className="text-sm text-muted-foreground">Age {connection.age}</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Phone size={14} /> {connection.phone}</span>
          <span className="flex items-center gap-1"><MapPin size={14} /> {connection.location}</span>
        </div>
      </div>

      <div className="page-padding space-y-5">
        {/* Notes */}
        <section className="card-ios p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Notes</h3>
            <button onClick={() => setEditingNotes(!editingNotes)} className="text-xs text-primary font-medium">
              {editingNotes ? 'Done' : 'Edit'}
            </button>
          </div>
          {editingNotes ? (
            <textarea
              value={connection.notes}
              onChange={(e) => updateNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border-0 focus:ring-2 focus:ring-primary outline-none resize-none text-sm"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{connection.notes || 'No notes yet'}</p>
          )}
        </section>

        {/* Milestones */}
        <section className="card-ios p-4">
          <h3 className="font-semibold text-foreground mb-3">Milestones</h3>
          <div className="grid grid-cols-2 gap-3">
            {milestoneItems.map(({ key, label, icon: Icon, value, type }) => (
              <div key={key} className="flex items-center gap-2 p-2 rounded-xl bg-secondary/50">
                <Icon size={16} className="text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground flex-1">{label}</span>
                {type === 'toggle' ? (
                  <button
                    onClick={() => updateMilestone(key, !value)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-ios ${
                      value ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {value ? '✓' : '·'}
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateMilestone(key, Math.max(0, (value as number) - 1))} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-foreground">−</button>
                    <span className="text-sm font-semibold text-foreground w-6 text-center">{value as number}</span>
                    <button onClick={() => updateMilestone(key, (value as number) + 1)} className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">+</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="card-ios p-4">
          <h3 className="font-semibold text-foreground mb-3">Timeline</h3>
          {connectionEvents.length > 0 ? (
            <div className="space-y-3">
              {connectionEvents.map(event => (
                <button
                  key={event.id}
                  onClick={() => openEvent(event.id, 'view')}
                  className="w-full flex gap-3 items-start text-left hover:bg-secondary/50 rounded-xl p-2 -mx-2 transition-colors active-scale"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.date} · {event.time}{event.location ? ` · ${event.location}` : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No events with this connection yet</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ConnectionDetailPage;
