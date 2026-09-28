function ActivityLog({ logs }) {
  return (
    <div className="card" style={{marginBottom: '1rem'}}>
      <h2>Activity Log</h2>
      <div className="log-container">
        {logs.map((log, index) => {
          let icon = 'ℹ️';
          if (log.includes('✓')) icon = '✅';
          if (log.includes('⚠')) icon = '⚠️';
          if (log.includes('❌')) icon = '❌';
          if (log.includes('🔄')) icon = '🔄';
          
          const cleanLog = log.replace(/[✓⚠❌🔄]/gu, '').trim();
          
          return (
            <div key={index} className="log-item">
              <span className="log-icon">{icon}</span>
              <span>{cleanLog}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActivityLog;
