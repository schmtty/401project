import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { useConnections } from '@/hooks/useConnections';
import { generateId } from '@/utils/sampleData';
import type { Connection } from '@/utils/sampleData';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const avatars = ['👨‍🦱', '👩‍🦰', '👨', '👩', '🧔', '👱‍♀️', '👱', '🧑‍🦱'];

const NewConnectionPage = () => {
  useDocumentTitle('New Connection');
  const navigate = useNavigate();
  const [connections, setConnections] = useConnections();
  const [form, setForm] = useState({
    name: '', age: '', phone: '', location: '', notes: '', avatar: avatars[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newConnection: Connection = {
      id: generateId(),
      name: form.name,
      age: parseInt(form.age) || 0,
      phone: form.phone,
      location: form.location,
      notes: form.notes,
      gender: 'male',
      relationship: 'connection',
      liked: false,
      createdAt: new Date().toISOString().split('T')[0],
      milestones: { dates: 0, heldHands: false, kissed: false, metParents: false, contactStreak: 0 },
    };
    setConnections(prev => [...prev, newConnection]);
    navigate('/connections');
  };

  return (
    <div className="mobile-container pb-24">
      <PageHeader title="New Connection" showBack />
      <form onSubmit={handleSubmit} className="page-padding space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Avatar</label>
          <div className="flex gap-2 flex-wrap">
            {avatars.map(a => (
              <button
                type="button"
                key={a}
                onClick={() => setForm(f => ({ ...f, avatar: a }))}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-ios ${
                  form.avatar === a ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        {[
          { key: 'name', label: 'Name', type: 'text', placeholder: 'Full name' },
          { key: 'age', label: 'Age', type: 'number', placeholder: 'Age' },
          { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '555-0000' },
          { key: 'location', label: 'Location', type: 'text', placeholder: 'Where you met' },
        ].map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>
            <input
              type={type}
              placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border-0 focus:ring-2 focus:ring-primary outline-none transition-ios"
            />
          </div>
        ))}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Notes</label>
          <textarea
            placeholder="Notes about this person..."
            value={form.notes}
            onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border-0 focus:ring-2 focus:ring-primary outline-none resize-none transition-ios"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold active-scale"
        >
          Add Connection
        </button>
      </form>
    </div>
  );
};

export default NewConnectionPage;
