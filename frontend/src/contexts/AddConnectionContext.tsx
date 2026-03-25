import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { User, Heart } from "lucide-react";
import { useConnections } from "@/hooks/useConnections";
import { generateId } from "@/utils/sampleData";
import type {
  Connection,
  ConnectionGender,
  ConnectionRelationship,
} from "@/utils/sampleData";
import { formatPhoneNumber } from "@/utils/phoneFormat";

type FormState = {
  name: string;
  age: string;
  phone: string;
  location: string;
  notes: string;
  gender: ConnectionGender;
  relationship: ConnectionRelationship;
  liked: boolean;
};

const initialForm: FormState = {
  name: "",
  age: "",
  phone: "",
  location: "",
  notes: "",
  gender: "male",
  relationship: "connection",
  liked: false,
};

interface AddConnectionContextType {
  isOpen: boolean;
  open: () => void;
  openForEdit: (connection: Connection) => void;
  close: () => void;
}

const AddConnectionContext = createContext<
  AddConnectionContextType | undefined
>(undefined);

export function AddConnectionProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [connections, setConnections] = useConnections();
  const [form, setForm] = useState<FormState>(initialForm);
  const [phoneError, setPhoneError] = useState("");

  const open = useCallback(() => {
    setEditingId(null);
    setForm(initialForm);
    setIsOpen(true);
  }, []);

  const openForEdit = useCallback((connection: Connection) => {
    setEditingId(connection.id);
    setForm({
      name: connection.name,
      age: String(connection.age),
      phone: formatPhoneNumber(connection.phone),
      location: connection.location,
      notes: connection.notes,
      gender: connection.gender ?? "male",
      relationship: connection.relationship ?? "connection",
      liked: connection.liked ?? false,
    });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingId(null);
    setForm(initialForm);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    if (!form.name.trim()) return;
    if (form.phone && !/^\(\d{3}\) \d{3}-\d{4}$/.test(form.phone)) {
      setPhoneError(
        "Please enter a complete phone number in the format (123) 456-7890",
      );
      return;
    }
    if (editingId) {
      setConnections((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: form.name,
                age: parseInt(form.age) || 0,
                phone: form.phone,
                location: form.location,
                notes: form.notes,
                gender: form.gender,
                relationship: form.relationship,
                liked: form.liked,
              }
            : c,
        ),
      );
    } else {
      const newConnection: Connection = {
        id: generateId(),
        name: form.name,
        age: parseInt(form.age) || 0,
        phone: form.phone,
        location: form.location,
        notes: form.notes,
        gender: form.gender,
        relationship: form.relationship,
        liked: form.liked,
        createdAt: new Date().toISOString().split("T")[0],
        milestones: {
          dates: 0,
          heldHands: false,
          kissed: false,
          metParents: false,
          contactStreak: 0,
        },
      };
      setConnections((prev) => [...prev, newConnection]);
    }
    close();
  };

  return (
    <AddConnectionContext.Provider value={{ isOpen, open, openForEdit, close }}>
      {children}
      {isOpen && (
        <AddConnectionModal
          form={form}
          setForm={setForm}
          phoneError={phoneError}
          onSubmit={handleSubmit}
          onClose={close}
          isEdit={!!editingId}
        />
      )}
    </AddConnectionContext.Provider>
  );
}

function AddConnectionModal({
  form,
  setForm,
  phoneError,
  onSubmit,
  onClose,
  isEdit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  phoneError: string;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isEdit: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-end overflow-hidden">
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md mx-auto bg-card rounded-t-3xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 flex-shrink-0 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">
            {isEdit ? "Edit Connection" : "New Connection"}
          </h3>
          <button
            onClick={onClose}
            className="tap-target flex items-center justify-center text-muted-foreground text-xl active-scale"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          <form onSubmit={onSubmit} className="p-5 space-y-4 pb-24">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Gender
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, gender: "male" }))}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all active-scale ${
                    form.gender === "male"
                      ? "ring-2 ring-blue-500 bg-blue-500/10"
                      : "bg-secondary"
                  }`}
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-600">
                    <User size={28} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Male
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, gender: "female" }))}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all active-scale ${
                    form.gender === "female"
                      ? "ring-2 ring-pink-500 bg-pink-500/10"
                      : "bg-secondary"
                  }`}
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-pink-500/20 text-pink-600">
                    <User size={28} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Female
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Relationship
              </label>
              <select
                value={form.relationship}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    relationship: e.target.value as ConnectionRelationship,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="connection">Connection</option>
                <option value="friend">Friend</option>
                <option value="family">Family</option>
              </select>
            </div>

            {[
              {
                key: "name",
                label: "Name",
                type: "text",
                placeholder: "Full name",
              },
              { key: "age", label: "Age", type: "number", placeholder: "Age" },
              {
                key: "phone",
                label: "Phone Number",
                type: "tel",
                placeholder: "(123) 456-7890",
              },
              {
                key: "location",
                label: "Location",
                type: "text",
                placeholder: "Where you met",
              },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  {label}
                </label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key as keyof FormState]}
                  onChange={(e) => {
                    if (key === "phone") {
                      setForm((f) => ({
                        ...f,
                        phone: formatPhoneNumber(e.target.value),
                      }));
                    } else {
                      setForm((f) => ({ ...f, [key]: e.target.value }));
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border-0 focus:ring-2 focus:ring-primary outline-none transition-ios"
                />
                {key === "phone" && phoneError && (
                  <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                )}
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Notes
              </label>
              <textarea
                placeholder="Notes about this person..."
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border-0 focus:ring-2 focus:ring-primary outline-none resize-none transition-ios"
              />
            </div>

            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, liked: !f.liked }))}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all active-scale ${
                form.liked
                  ? "bg-pink-500/20 text-pink-600 border-2 border-pink-500"
                  : "bg-secondary text-muted-foreground border-2 border-transparent"
              }`}
            >
              <Heart size={20} className={form.liked ? "fill-current" : ""} />
              Like this person
            </button>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold active-scale"
            >
              {isEdit ? "Save Changes" : "Add Connection"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function useAddConnection() {
  const ctx = useContext(AddConnectionContext);
  if (!ctx)
    throw new Error(
      "useAddConnection must be used within AddConnectionProvider",
    );
  return ctx;
}
