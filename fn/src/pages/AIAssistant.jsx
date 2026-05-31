import { useState, useRef } from 'react';
import { api } from '../api/client.js';
import CarCard from '../components/CarCard.jsx';
import ChatActions from '../components/ChatActions.jsx';

const QUICK_PROMPTS = [
  'Compare Tata Nexon EV and Hyundai Ioniq 5',
  'Show me SUVs under 15 lakh',
  'EMI for Mahindra Thar with 3L down at 9% over 5 years',
  'I want a 7-seater for a family of 6',
  'Best fuel-efficient car under 10 lakh',
];

export default function AIAssistant() {
  const [tab, setTab] = useState('chat');
  return (
    <div className="ai-page">
      <h1>🤖 AI Car Assistant</h1>
      <p>Powered by open-source Llama 3.3 70B. Compare cars, calculate EMI, apply filters, book test drives, identify cars from photos.</p>
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
    { role: 'ai', text: 'Hi! I can compare cars, calculate EMI, filter the catalog, book test drives, or identify cars from photos. What would you like to do?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = [...messages, userMsg].filter((m) => m.role === 'user' || m.role === 'ai');
      const res = await api.chat(text, history);
      setMessages((m) => [...m, {
        role: 'ai',
        text: res.reply,
        suggestions: res.suggestions,
        actions: res.actions,
        provider: res.provider,
      }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'ai', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => { e.preventDefault(); sendMessage(input); };

  const onImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result).split(',')[1];
      const localUrl = URL.createObjectURL(file);
      setMessages((m) => [...m, { role: 'user', text: '📷 Identify this car', image: localUrl }]);
      setLoading(true);
      try {
        const res = await api.vision({ image_base64: base64 });
        const id = res.identification || {};
        const matched = res.matched_car;
        const text = `That looks like a **${id.brand || '?'} ${id.model || ''}** — a ${id.body_type || 'car'}. ${id.features ? `Notable: ${id.features}.` : ''}${matched ? ` We have the ${matched.brand} ${matched.model} in stock for ₹${(matched.price_inr/100000).toFixed(2)}L.` : ' No exact match in our catalog.'}`;
        setMessages((m) => [...m, {
          role: 'ai',
          text,
          suggestions: matched ? [matched] : [],
          provider: 'groq vision',
        }]);
      } catch (err) {
        setMessages((m) => [...m, { role: 'ai', text: `Vision error: ${err.message}` }]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="chat">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-${m.role}`}>
            <div className="chat-bubble">
              {m.image && <img src={m.image} alt="uploaded" className="chat-image" />}
              <span dangerouslySetInnerHTML={{ __html: renderMd(m.text || '') }} />
              {m.provider && m.provider !== 'rule-based' && (
                <span className="chat-provider">⚡ {m.provider}</span>
              )}
            </div>
            {m.actions?.length > 0 && <ChatActions actions={m.actions} />}
            {m.suggestions?.length > 0 && (
              <div className="chat-cars">
                {m.suggestions.map((c) => <CarCard key={c.id} car={c} />)}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="chat-msg chat-ai"><div className="chat-bubble">Thinking…</div></div>}
      </div>

      {messages.length <= 2 && (
        <div className="quick-prompts">
          {QUICK_PROMPTS.map((q) => (
            <button key={q} onClick={() => sendMessage(q)} disabled={loading}>{q}</button>
          ))}
        </div>
      )}

      <form className="chat-input" onSubmit={onSubmit}>
        <button
          type="button"
          className="icon-btn"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          title="Upload a car photo"
        >📷</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImage} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything — compare, EMI, filter, book a test drive…"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}

function renderMd(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
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
        <label>Budget (in lakhs)
          <input type="number" placeholder="e.g. 12" value={prefs.budget} onChange={(e) => setPrefs({ ...prefs, budget: e.target.value })} />
        </label>
        <label>Fuel Type
          <select value={prefs.fuel_type} onChange={(e) => setPrefs({ ...prefs, fuel_type: e.target.value })}>
            <option value="">Any</option><option>Petrol</option><option>Diesel</option><option>Electric</option><option>Hybrid</option>
          </select>
        </label>
        <label>Body Type
          <select value={prefs.body_type} onChange={(e) => setPrefs({ ...prefs, body_type: e.target.value })}>
            <option value="">Any</option><option>Hatchback</option><option>SUV</option><option>MPV</option><option>Micro SUV</option><option>Crossover</option>
          </select>
        </label>
        <label>Min Seats
          <input type="number" min="2" max="8" placeholder="5" value={prefs.seats} onChange={(e) => setPrefs({ ...prefs, seats: e.target.value })} />
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={prefs.prefer_mileage} onChange={(e) => setPrefs({ ...prefs, prefer_mileage: e.target.checked })} />
          Prefer high mileage
        </label>
        <button type="submit" className="primary" disabled={loading}>{loading ? 'Finding…' : 'Get Recommendations'}</button>
      </form>
      {result?.error && <div className="error">⚠️ {result.error}</div>}
      {result?.recommendations && (
        <div>
          <p className="reasoning">{result.reasoning}</p>
          <div className="car-grid">{result.recommendations.map((c) => <CarCard key={c.id} car={c} />)}</div>
        </div>
      )}
    </div>
  );
}
