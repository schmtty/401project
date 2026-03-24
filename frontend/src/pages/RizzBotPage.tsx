import { useState, useRef, useEffect, useMemo } from 'react';
import { Loader2, Send } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useConnections } from '@/hooks/useConnections';
import { useEventModal } from '@/contexts/EventModalContext';
import { useUser } from '@/contexts/UserContext';
import { api } from '@/lib/api';
import { generateId } from '@/utils/sampleData';
import type { Connection, ChatMessage, CalendarEvent } from '@/utils/sampleData';
import { deriveMilestonesFromEvents } from '@/utils/deriveMilestones';
import { localDateStr } from '@/utils/eventTime';

const OBJECTIVES = [
  'Ask on a date',
  'Ask on a second date',
  'Apologize for something',
  'Escalate flirtation',
  'Keep the conversation going',
  'Plan a hangout',
];

const EMPTY_MILESTONES = {
  dates: 0,
  heldHands: false,
  kissed: false,
  metParents: false,
  contactStreak: 0,
};

type RizzContext = {
  connectionNotes: string;
  eventSummaries: { title: string; notes: string; type: string; date: string }[];
  milestones: { dates: number; heldHands: boolean; kissed: boolean; metParents: boolean; contactStreak: number };
  relationship: string;
  upcomingEvents: { title: string; date: string }[];
};

function extractContextFromNotes(notes: string): string[] {
  if (!notes?.trim()) return [];
  return notes
    .split(/[.!?\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3 && s.length < 100);
}

function buildRizzContext(
  connection: Connection | undefined,
  connectionEvents: CalendarEvent[]
): RizzContext {
  if (!connection) {
    return {
      connectionNotes: '',
      eventSummaries: [],
      milestones: EMPTY_MILESTONES,
      relationship: 'connection',
      upcomingEvents: [],
    };
  }

  const today = localDateStr();
  const sortedEvents = [...connectionEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return {
    connectionNotes: connection.notes || '',
    eventSummaries: sortedEvents.map((e) => ({
      title: e.title,
      notes: e.status === 'happened' ? e.reportNotes || '' : '',
      type: e.type,
      date: e.date,
    })),
    milestones: connection.liked
      ? deriveMilestonesFromEvents(connection.id, connectionEvents)
      : EMPTY_MILESTONES,
    relationship: connection.relationship || 'connection',
    upcomingEvents: connectionEvents
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({ title: e.title, date: e.date })),
  };
}

const generateResponse = (
  connection: Connection | undefined,
  objective: string,
  userMessage: string,
  ctx: RizzContext
): string => {
  const name = connection?.name || 'them';
  const msg = userMessage.trim();
  const msgLower = msg.toLowerCase();

  // Draft analysis
  const tooShort = msg.length > 0 && msg.length < 15;
  const tooLong = msg.length > 200;
  const hasQuestion = msg.includes('?');
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(userMessage);
  const overlyFormal =
    /\b(i would like to|i wish to|would you be so kind|permit me to|kindly)\b/i.test(msg) ||
    /\b(inquire|regarding|hereby|thereby)\b/i.test(msg);
  const hasClearAsk =
    objective.includes('date') &&
    (msgLower.includes('want') ||
      msgLower.includes('would you') ||
      msgLower.includes('wanna') ||
      msgLower.includes('how about') ||
      msgLower.includes('?'));
  const apologyOwnership =
    objective === 'Apologize for something' &&
    (msgLower.includes("i'm sorry") ||
      msgLower.includes('i am sorry') ||
      msgLower.includes('my fault') ||
      msgLower.includes('i apologize'));
  const usesName = new RegExp(`\\b${name}\\b`, 'i').test(msg);
  const keyPhrases = extractContextFromNotes(ctx.connectionNotes);

  // Build observations (what works / what to improve)
  const observations: string[] = [];
  if (msg.length === 0) {
    observations.push("No draft yet — that's okay! I'll give you some tailored ideas to get started.");
  } else {
    if (tooShort) {
      observations.push(
        "Your message is friendly but vague — being more specific makes it easier for them to say yes."
      );
    }
    if (tooLong) {
      observations.push(
        "Your message might feel overwhelming — shorter texts often get better responses."
      );
    }
    if (overlyFormal && objective !== 'Apologize for something') {
      observations.push("The tone feels a bit formal for texting — try something more casual.");
    }
    if (hasQuestion && (objective === 'Ask on a date' || objective === 'Ask on a second date')) {
      observations.push("Asking a question is great — it invites a clear response.");
    }
    if (hasEmoji) {
      observations.push("The emoji adds personality — nice touch!");
    }
    if (apologyOwnership) {
      observations.push("Taking ownership is important — you're on the right track.");
    }
    if (usesName) {
      observations.push("Using their name personalizes it — good call.");
    }
    if (
      (objective === 'Ask on a date' || objective === 'Ask on a second date') &&
      !hasClearAsk &&
      msg.length > 0
    ) {
      observations.push("Consider ending with a clear ask (e.g. a question or specific invite).");
    }
  }

  // Context-aware personalization
  const contextHints: string[] = [];
  if (ctx.upcomingEvents.length > 0) {
    const next = ctx.upcomingEvents[0];
    contextHints.push(
      `You have "${next.title}" coming up on ${next.date} — consider referencing it or confirming details.`
    );
  }
  if (keyPhrases.length > 0) {
    const phrase = keyPhrases[0];
    if (phrase.length < 50) {
      contextHints.push(`You noted: "${phrase}" — try weaving that into your message.`);
    }
  }
  const eventWithNotes = ctx.eventSummaries.find((e) => e.notes.trim().length > 0);
  if (eventWithNotes) {
    contextHints.push(
      `From your ${eventWithNotes.type} notes: "${eventWithNotes.notes.slice(0, 80)}${eventWithNotes.notes.length > 80 ? '...' : ''}" — you could reference this.`
    );
  }
  if (ctx.milestones.dates > 0 && (objective === 'Ask on a date' || objective === 'Ask on a second date')) {
    contextHints.push(
      `You've been out ${ctx.milestones.dates} time${ctx.milestones.dates > 1 ? 's' : ''} — build on that shared history.`
    );
  }
  if (ctx.relationship === 'friend' && objective === 'Escalate flirtation') {
    contextHints.push("They're a friend — keep it light and playful so it doesn't feel forced.");
  }

  // Build tailored suggestions per objective
  const getSuggestion = (): string => {
    const { milestones, connectionNotes } = ctx;
    const hasHistory = milestones.dates > 0;

    switch (objective) {
      case 'Ask on a date':
        if (ctx.upcomingEvents.length > 0) {
          return `Try: "Hey! Still on for ${ctx.upcomingEvents[0].title}? I'm looking forward to it 😊"`;
        }
        if (keyPhrases.length > 0) {
          return `Based on your notes, try: "Hey ${name}! I've been thinking about [something from your notes]. Want to [specific activity] this weekend?"`;
        }
        return `Try: "Hey ${name}! I found this cool spot [downtown/near campus]. Want to check it out this weekend?"`;
      case 'Ask on a second date':
        if (hasHistory) {
          return `Try: "I had such a good time last time! There's this [event/place] I've been wanting to try — want to go together?"`;
        }
        return `Try: "Hey! I keep thinking about our last hangout. Want to do something again soon?"`;
      case 'Apologize for something':
        return `Try: "Hey ${name}, I've been thinking about what happened and I feel bad. I'm sorry — I want to make it right. Can we talk?"`;
      case 'Escalate flirtation':
        if (milestones.heldHands || milestones.kissed) {
          return `Try: "Not gonna lie, I keep thinking about you. Just saying 😊"`;
        }
        return `Try: "I have to admit, talking to you is the highlight of my day."`;
      case 'Keep the conversation going':
        if (keyPhrases.length > 0) {
          return `Reference your notes: "Hey, you mentioned ${keyPhrases[0].slice(0, 40)}... tell me more!"`;
        }
        return `Try: "So I'm curious — what's something you're really into that most people don't know?"`;
      case 'Plan a hangout':
        if (connection?.location) {
          return `Try: "What are you up to this weekend? I was thinking we could do something near ${connection.location}."`;
        }
        return `Try: "Hey ${name}! A bunch of us are doing [activity] this Saturday. You should totally come!"`;
      default:
        return `Try: "Hey ${name}! [Your specific ask or question]"`;
    }
  };

  const suggestion = getSuggestion();

  // Assemble response: observations + context hints + suggestion
  const parts: string[] = [];
  if (observations.length > 0) {
    parts.push(observations.join(' '));
  }
  if (contextHints.length > 0) {
    parts.push(contextHints[0]);
  }
  parts.push(suggestion);

  return parts.join(' ');
};

const RizzBotPage = () => {
  const { currentUser } = useUser();
  const [connections] = useConnections();
  const { events } = useEventModal();
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedObjective, setSelectedObjective] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const connection = connections.find((c) => c.id === selectedConnection);
  const connectionEvents = useMemo(
    () => (selectedConnection ? events.filter((e) => e.connectionId === selectedConnection) : []),
    [events, selectedConnection]
  );
  const rizzContext = useMemo(
    () => buildRizzContext(connection, connectionEvents),
    [connection, connectionEvents]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentUser) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.rizzbot.generate(currentUser.id, {
        connection: connection
          ? {
              name: connection.name,
              notes: connection.notes,
              location: connection.location,
              relationship: connection.relationship,
              milestones: connection.liked
                ? deriveMilestonesFromEvents(connection.id, connectionEvents)
                : EMPTY_MILESTONES,
            }
          : { name: 'them' },
        objective: selectedObjective,
        userMessage: input,
        context: rizzContext,
      });
      const botMsg: ChatMessage = {
        id: generateId(),
        text: res.text,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const botMsg: ChatMessage = {
        id: generateId(),
        text: generateResponse(connection, selectedObjective, input, rizzContext),
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildWelcomeMessage = (): string => {
    const name = connection?.name || 'them';
    const parts: string[] = [
      `Hey! I'm RizzBot 🤖 I see you want to "${selectedObjective}" with ${name}.`,
    ];
    if (rizzContext.connectionNotes) {
      parts.push(`I've got your notes about them.`);
    }
    if (rizzContext.upcomingEvents.length > 0) {
      parts.push(
        `You have "${rizzContext.upcomingEvents[0].title}" coming up on ${rizzContext.upcomingEvents[0].date}.`
      );
    }
    if (rizzContext.eventSummaries.length > 0) {
      parts.push(`I can see your past events with them too.`);
    }
    parts.push(
      `I'll give you specific feedback on your drafts and tailor suggestions to what I know about ${name}. Go ahead, type what you're thinking!`
    );
    return parts.join(' ');
  };

  const startSession = () => {
    if (!selectedConnection || !selectedObjective) return;
    setMessages([
      {
        id: generateId(),
        text: buildWelcomeMessage(),
        sender: 'bot',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="mobile-container flex flex-col" style={{ height: '100dvh' }}>
      <PageHeader title="RizzBot 🤖" showBack />

      {messages.length === 0 ? (
        <div className="flex-1 page-padding space-y-4 animate-fade-in">
          <div className="card-ios p-4 gradient-card border-primary/10">
            <p className="text-sm text-muted-foreground">
              Select a connection and what you want to accomplish. I'll help you craft the perfect
              message!
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Who are you texting?
            </label>
            <select
              value={selectedConnection}
              onChange={(e) => setSelectedConnection(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-card text-foreground border border-border outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select connection</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              What do you want to do?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj}
                  onClick={() => setSelectedObjective(obj)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-ios active-scale ${
                    selectedObjective === obj
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-foreground'
                  }`}
                >
                  {obj}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            disabled={!selectedConnection || !selectedObjective}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold active-scale disabled:opacity-40 shadow-lg shadow-primary/25"
          >
            Start Session
          </button>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-card text-card-foreground border border-border rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-slide-up">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md bg-card border border-border flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  RizzBot is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border bg-card p-3 pb-24">
            <div className="flex gap-2 items-end">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                placeholder="Type your message idea..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary text-sm disabled:opacity-60"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="tap-target flex items-center justify-center rounded-xl bg-primary text-primary-foreground p-3 active-scale disabled:opacity-60 disabled:pointer-events-none"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RizzBotPage;
