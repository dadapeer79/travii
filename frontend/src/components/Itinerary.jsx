function Itinerary({ data }) {
  if (!data || !data.itinerary) return null;

  const { budget, itinerary, transport, hotel, parsed_request } = data;

  return (
    <div className="card" style={{marginBottom: '1rem'}}>
      <h2>Final Itinerary</h2>
      
      <div style={{marginBottom: '1.5rem'}}>
        <p style={{color: 'var(--text-muted)'}}>
          Trip to <strong>{parsed_request.destination}</strong> for {parsed_request.days} days ({parsed_request.travelers} travelers)
        </p>
      </div>

      <div className="itinerary-days">
        {itinerary.map((day) => (
          <div key={day.day} className="day-card">
            <div className="day-header">Day {day.day}</div>
            <div>{day.plan}</div>
          </div>
        ))}
      </div>

      <div className="budget-section">
        <h3 style={{marginBottom: '1rem'}}>Budget Breakdown</h3>
        <div className="budget-item">
          <span>Transport ({transport.mode})</span>
          <span>₹{budget.transport.toLocaleString()}</span>
        </div>
        <div className="budget-item">
          <span>Hotel ({hotel.name})</span>
          <span>₹{budget.hotel.toLocaleString()}</span>
        </div>
        <div className="budget-item">
          <span>Food (Est.)</span>
          <span>₹{budget.food.toLocaleString()}</span>
        </div>
        <div className="budget-item">
          <span>Activities</span>
          <span>₹{budget.activities.toLocaleString()}</span>
        </div>
        
        <div className="budget-total">
          <span>Total Cost:</span>
          <span>₹{budget.total.toLocaleString()}</span>
        </div>
        
        <div style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '0.5rem', 
          color: budget.within_budget ? 'var(--success)' : 'var(--error)'
        }}>
          <span>Target Budget: ₹{budget.budget.toLocaleString()}</span>
          <span>Remaining: ₹{budget.remaining.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default Itinerary;
