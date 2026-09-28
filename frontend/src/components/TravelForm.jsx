import { useState } from 'react';

function TravelForm({ onPlan, onDemoSuccess, onDemoFailure }) {
  const [formData, setFormData] = useState({
    origin: 'Bengaluru',
    destination: 'Goa',
    days: 3,
    travelers: 2,
    budget: 10000,
    interests: 'Beach, Food'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPlan(formData);
  };

  return (
    <div className="card">
      <h2>Travel Request</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>From</label>
          <input className="form-input" name="origin" value={formData.origin} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Destination</label>
          <input className="form-input" name="destination" value={formData.destination} onChange={handleChange} required />
        </div>
        <div style={{display: 'flex', gap: '1rem'}}>
          <div className="form-group" style={{flex: 1}}>
            <label>Days</label>
            <input type="number" className="form-input" name="days" value={formData.days} onChange={handleChange} required min="1" />
          </div>
          <div className="form-group" style={{flex: 1}}>
            <label>Travelers</label>
            <input type="number" className="form-input" name="travelers" value={formData.travelers} onChange={handleChange} required min="1" />
          </div>
        </div>
        <div className="form-group">
          <label>Budget (₹)</label>
          <input type="number" className="form-input" name="budget" value={formData.budget} onChange={handleChange} required min="500" />
        </div>
        <div className="form-group">
          <label>Interests</label>
          <input className="form-input" name="interests" value={formData.interests} onChange={handleChange} required />
        </div>
        
        <button type="submit" className="btn btn-primary">PLAN MY TRIP</button>
      </form>
      
      <div style={{marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)'}}>
        <p style={{fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem'}}>Pre-configured Tests:</p>
        <button type="button" className="btn btn-demo" onClick={onDemoSuccess}>DEMO SUCCESS</button>
        <button type="button" className="btn btn-demo" onClick={onDemoFailure}>DEMO RE-PLANNING</button>
      </div>
    </div>
  );
}

export default TravelForm;
