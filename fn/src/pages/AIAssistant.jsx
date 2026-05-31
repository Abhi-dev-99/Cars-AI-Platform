import { useState } from 'react';
import { api } from '../api/client.js';
import CarCard from '../components/CarCard.jsx';

export default function AIAssistant() {
  const [tab, setTab] = useState('chat');

  return (
    <div className="ai-page">
      <h1>🤖 AI Car Assistant</h1>
      <p>Get personalized recommendations or chat about cars in natural language.</p>

      <div className="tabs">
        <button className={tab === 'chat' ? 'tab active' : 'tab'} onClick={() => setTab('chat')}>Chat</button>
        <button className={tab === 'recommend' ? 'tab active' : 'tab'} onClick={() => setTab('recommend')}>Recommend</button>
      </div>

      {tab === 'chat' ? <ChatTab /> : <RecommendTab />}
    </div>
  );
}

function ChatTab() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! Ask me anything — try "Show me an SUV under 15 lakh" or "I want a hybrid car".' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.chat(input);
      setMessages((m) => [...m, { role: 'ai', text: res.reply, suggestions: res.suggestions }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'ai', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-${m.role}`}>
            <div className="chat-bubble">{m.text}</div>
            {m.suggestions?.length > 0 && (
              <div className="chat-cars">
                {m.suggestions.map((c) => <CarCard key={c.id} car={c} />)}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="chat-msg chat-ai"><div className="chat-bubble">Thinking…</div></div>}
      </div>
      <form className="chat-input" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about cars…"
        />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
}

function RecommendTab() {
  const [prefs, setPrefs] = useState({ budget: '', fuel_type: '', body_type: '', seats: '', prefer_mileage: false });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.recommend({
        ...prefs,
        budget: prefs.budget ? Number(prefs.budget) * 100000 : undefined,
        seats: prefs.seats ? Number(prefs.seats) : undefined,
      });
      setResult(res);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="recommend-form" onSubmit={submit}>
        <label>
          Budget (in lakhs)
          <input
            type="number"
            placeholder="e.g. 12"
            value={prefs.budget}
            onChange={(e) => setPrefs({ ...prefs, budget: e.target.value })}
          />
        </label>
        <label>
          Fuel Type
          <select value={prefs.fuel_type} onChange={(e) => setPrefs({ ...prefs, fuel_type: e.target.value })}>
            <option value="">Any</option>
            <option>Petrol</option>
            <option>Diesel</option>
            <option>Electric</option>
            <option>Hybrid</option>
          </select>
        </label>
        <label>
          Body Type
          <select value={prefs.body_type} onChange={(e) => setPrefs({ ...prefs, body_type: e.target.value })}>
            <option value="">Any</option>
            <option>Hatchback</option>
            <option>SUV</option>
            <option>MPV</option>
            <option>Micro SUV</option>
            <option>Crossover</option>
          </select>
        </label>
        <label>
          Min Seats
          <input
            type="number"
            min="2"
            max="8"
            placeholder="5"
            value={prefs.seats}
            onChange={(e) => setPrefs({ ...prefs, seats: e.target.value })}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={prefs.prefer_mileage}
            onChange={(e) => setPrefs({ ...prefs, prefer_mileage: e.target.checked })}
          />
          Prefer high mileage
        </label>
        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Finding…' : 'Get Recommendations'}
        </button>
      </form>

      {result?.error && <div className="error">⚠️ {result.error}</div>}
      {result?.recommendations && (
        <div>
          <p className="reasoning">{result.reasoning}</p>
          <div className="car-grid">
            {result.recommendations.map((c) => <CarCard key={c.id} car={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}
