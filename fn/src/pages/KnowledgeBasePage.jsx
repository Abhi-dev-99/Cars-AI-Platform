import KnowledgeBase from '../components/KnowledgeBase.jsx';

export default function KnowledgeBasePage() {
  return (
    <div className="kb-page">
      <h1>⚙️ Configure</h1>
      <p>Manage the car catalog. Changes are live for the AI chat and browse page instantly.</p>
      <KnowledgeBase />
    </div>
  );
}
