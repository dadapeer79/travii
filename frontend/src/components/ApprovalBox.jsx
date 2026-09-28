function ApprovalBox({ data, onApprove, onReject }) {
  if (!data) return null;
  
  return (
    <div className="card" style={{border: '1px solid var(--warning)'}}>
      <h2 style={{color: 'var(--warning)'}}>
        ⚠️ HUMAN APPROVAL REQUIRED
      </h2>
      <p style={{marginBottom: '1rem'}}>
        TRAVII has prepared the trip.
      </p>
      <p style={{marginBottom: '1.5rem', fontSize: '1.125rem'}}>
        Estimated cost: <strong>₹{data.budget.total.toLocaleString()}</strong>
      </p>
      <p style={{marginBottom: '1rem'}}>
        Would you like to continue with the booking simulation?
      </p>
      
      <div style={{display: 'flex', gap: '1rem'}}>
        <button 
          className="btn btn-primary" 
          style={{background: 'var(--success)', marginBottom: 0}}
          onClick={onApprove}
        >
          APPROVE
        </button>
        <button 
          className="btn btn-primary" 
          style={{background: 'var(--error)', marginBottom: 0}}
          onClick={onReject}
        >
          REJECT
        </button>
      </div>
    </div>
  );
}

export default ApprovalBox;
