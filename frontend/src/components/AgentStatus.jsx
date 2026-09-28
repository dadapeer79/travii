function AgentStatus({ status, currentLog }) {
  let badgeClass = 'status-idle';
  let statusText = 'Awaiting Request...';
  
  if (status === 'planning') {
    badgeClass = 'status-planning';
    statusText = 'Agent Active';
  } else if (status === 'replanning') {
    badgeClass = 'status-replanning';
    statusText = 'Re-planning...';
  } else if (status === 'success') {
    badgeClass = 'status-success';
    statusText = 'Trip Ready!';
  }
  
  return (
    <div className="card" style={{marginBottom: '1rem'}}>
      <h2>Agent Status</h2>
      <div className={`status-badge ${badgeClass}`}>
        {statusText}
      </div>
      {(status === 'planning' || status === 'replanning') && (
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)'}}>
          <div className="spinner"></div>
          <span>{currentLog || 'Thinking...'}</span>
        </div>
      )}
    </div>
  );
}

export default AgentStatus;
