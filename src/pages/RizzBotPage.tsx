import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { sampleConnections, generateId } from '@/utils/sampleData';
import type { Connection, ChatMessage } from '@/utils/sampleData';

const OBJECTIVES = [
  'Ask on a date',
  'Ask on a second date',
  'Apologize for something',
  'Escalate flirtation',
  'Keep the conversation going',
  'Plan a hangout',
];

const generateResponse = (connection: Connection | undefined, objective: string, userMessage: string): string => {
  const name = connection?.name || 'them';
  const notes = connection?.notes || '';

  const templates: Record<string, string[]> = {
    'Ask on a date': [
      `Hey, try something casual like: "Hey ${name}, I found this awesome spot downtown. Want to check it out this weekend?" Keep it light!`,
      `Based on your notes about ${name} (${notes}), try: "I've been wanting to try that new place near campus. Would you be down to go together?"`,
      `Here's an idea: "I had a great time last time we hung out. Want to grab dinner this Friday? I know a great spot."`,
    ],
    'Ask on a second date': [
      `Since you've already been out with ${name}, try: "I had such a good time the other day! There's this cool event happening this week — want to go together?"`,
      `Keep it natural: "Hey! I keep thinking about how fun our last hangout was. Want to do something again soon?"`,
      `Go for it: "I really enjoyed getting to know you better. How about we grab coffee this week and continue our conversation?"`,
    ],
    'Apologize for something': [
      `Be genuine: "Hey ${name}, I wanted to reach out because I feel bad about what happened. I'm sorry, and I want to make it right."`,
      `Try being direct: "I've been thinking about it, and I realize I should apologize. Can we talk about it?"`,
    ],
    'Escalate flirtation': [
      `Try playful teasing: "I have to admit, I keep finding excuses to text you 😄"`,
      `Be bold but smooth: "Not gonna lie, talking to you is the highlight of my day. Just saying."`,
      `Compliment naturally: "You know, every time I see you, you always manage to make me smile."`,
    ],
    'Keep the conversation going': [
      `Ask about their interests: "So I'm curious — what's something you're really passionate about that most people don't know?"`,
      `Share something personal: "Random question — if you could travel anywhere right now, where would you go?"`,
      `Reference your notes about ${name}: "Hey, you mentioned ${notes.split(' ').slice(0, 3).join(' ')}... tell me more about that!"`,
    ],
    'Plan a hangout': [
      `Be specific: "Hey ${name}! A bunch of us are doing [activity] this Saturday. You should totally come!"`,
      `Keep it casual: "What are you up to this weekend? I was thinking we could do something fun."`,
    ],
  };

  const options = templates[objective] || templates['Keep the conversation going'];
  return options[Math.floor(Math.random() * options.length)];
};

const RizzBotPage = () => {
  const [connections] = useLocalStorage<Connection[]>('connections', sampleConnections);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedObjective, setSelectedObjective] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const connection = connections.find(c => c.id === selectedConnection);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: generateId(), text: input, sender: 'user', timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate typing delay
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: generateId(),
        text: generateResponse(connection, selectedObjective, input),
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    }, 800 + Math.random() * 600);
  };

  const startSession = () => {
    if (!selectedConnection || !selectedObjective) return;
    setMessages([{
      id: generateId(),
      text: `Hey! I'm RizzBot 🤖 I see you want to "${selectedObjective}" with ${connection?.name}. ${connection?.notes ? `I notice from your notes: "${connection.notes}". ` : ''}Go ahead, type what you're thinking of saying, and I'll help you craft the perfect message!`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
    }]);
  };

  return (
    <div className="mobile-container flex flex-col" style={{ height: '100dvh' }}>
      <PageHeader title="RizzBot 🤖" />

      {messages.length === 0 ? (
        <div className="flex-1 page-padding space-y-4 animate-fade-in">
          <p className="text-sm text-muted-foreground">Select a connection and what you want to accomplish. I'll help you craft the perfect message!</p>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Who are you texting?</label>
            <select
              value={selectedConnection}
              onChange={e => setSelectedConnection(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-card text-foreground border border-border outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select connection</option>
              {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">What do you want to do?</label>
            <div className="grid grid-cols-2 gap-2">
              {OBJECTIVES.map(obj => (
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
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold active-scale disabled:opacity-40"
          >
            Start Session
          </button>
        </div>
      ) : (
        <>
          {/* Chat area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card text-card-foreground border border-border rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input bar */}
          <div className="border-t border-border bg-card p-3 pb-24">
            <div className="flex gap-2 items-end">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your message idea..."
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <button
                onClick={handleSend}
                className="tap-target flex items-center justify-center rounded-xl bg-primary text-primary-foreground p-3 active-scale"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RizzBotPage;
