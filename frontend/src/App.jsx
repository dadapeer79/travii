import { useEffect, useState } from 'react'
import './App.css'
import PlaceCard from './components/PlaceCard'
import PlaceExplorer from './components/PlaceExplorer'

const API_URL = 'http://localhost:5000'
const interestOptions = ['Beach', 'Food', 'Nature', 'Waterfall', 'History', 'Shopping', 'Nightlife']
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

function App() {
  const [health, setHealth] = useState(null)
  const [form, setForm] = useState({ origin: 'Bengaluru', destination: 'Goa', days: 3, travelers: 1, budget: 10000, interests: ['Beach', 'Food'], travel_style: 'budget' })
  const [result, setResult] = useState(null)
  const [events, setEvents] = useState([])
  const [busy, setBusy] = useState(false)
  const [chat, setChat] = useState('')
  const [approval, setApproval] = useState(null)
  const [error, setError] = useState('')
  const [places, setPlaces] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [placeNotice, setPlaceNotice] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/health`).then((response) => response.json()).then(setHealth).catch(() => setHealth({ backend: false, mode: 'offline' }))
  }, [])

  const run = async (endpoint, payload = {}) => {
    setBusy(true)
    setError('')
    setApproval(null)
    setEvents([])
    try {
      const response = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The agent could not complete the request.')
      setResult(data)
      setEvents(data.events || [])
      setPlaces(data.places || [])
      setSelectedPlace(data.selected_place || null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const updateForm = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const toggleInterest = (interest) => setForm({ ...form, interests: form.interests.includes(interest) ? form.interests.filter((item) => item !== interest) : [...form.interests, interest] })
  const planTrip = (event) => {
    event.preventDefault()
    run('/api/plan', { ...form, message: `Plan a ${form.days}-day trip from ${form.origin} to ${form.destination} under ₹${form.budget} for ${form.travelers} traveler(s). Interests: ${form.interests.join(', ')}` })
  }
  const sendChat = (event) => {
    event.preventDefault()
    if (!chat.trim() || !result) return
    run('/api/chat', { message: chat, current_plan: result })
    setChat('')
  }
  const approve = async (action) => {
    const response = await fetch(`${API_URL}/api/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    const data = await response.json()
    setApproval(data)
  }
  const addPlace = async (place) => {
    try {
      const response = await fetch(`${API_URL}/api/trip/add-place`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ place_id: place.place_id, day: 2, current_plan: result }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not update the itinerary.')
      setResult((current) => ({ ...current, itinerary: data.itinerary.length ? data.itinerary : current.itinerary }))
      setPlaceNotice(data.message)
      setSelectedPlace(null)
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  const reset = () => { setResult(null); setPlaces([]); setEvents([]); setError(''); setApproval(null); setSelectedPlace(null); setPlaceNotice('') }
  const activeEvent = events[events.length - 1]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">T</span><div><strong>TRAVII</strong><small>Your AI travel companion</small></div></div>
        <div className={`connection ${health?.backend ? 'online' : ''}`}><span />{health?.openai ? 'OpenAI connected' : health?.backend ? 'Simulation mode' : 'Connecting...'}</div>
      </header>

      <main>
        <section className="hero"><div className="hero-copy"><p className="eyebrow">AUTONOMOUS TRAVEL PLANNING</p><h1>Go somewhere<br /><em>worth remembering.</em></h1><p>TRAVII understands the brief, checks the details, and reshapes the plan until it fits.</p></div><div className="hero-stamp"><span>01</span><strong>Understand<br />Plan<br />Refine</strong></div></section>

        {result && <section className="places-section"><div className="places-heading"><div><p className="eyebrow">TRAVII DESTINATION EXPLORER</p><h2>Explore {result.plan.destination}</h2><p className="muted">Real places where connected, clearly marked demo data otherwise.</p></div><span className="status-pill">{places.length} RECOMMENDATIONS</span></div>{placeNotice && <div className="place-notice">✓ {placeNotice}</div>}<div className="place-grid">{places.map((place) => <PlaceCard key={place.place_id || place.name} place={place} onExplore={setSelectedPlace} onAdd={addPlace} />)}</div></section>}

        <section className="workspace">
          <aside className="control-column">
            <div className="panel request-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR BRIEF</p><h2>Where next?</h2></div><span className="live-dot">LIVE</span></div>
              <form onSubmit={planTrip}>
                <label>From<input name="origin" value={form.origin} onChange={updateForm} /></label>
                <label>Destination<input name="destination" value={form.destination} onChange={updateForm} /></label>
                <div className="form-row"><label>Days<input type="number" min="1" max="30" name="days" value={form.days} onChange={updateForm} /></label><label>Travelers<input type="number" min="1" name="travelers" value={form.travelers} onChange={updateForm} /></label></div>
                <label>Budget<input type="number" min="500" name="budget" value={form.budget} onChange={updateForm} /></label>
                <fieldset><legend>Interests</legend><div className="chips">{interestOptions.map((interest) => <button type="button" className={form.interests.includes(interest) ? 'chip selected' : 'chip'} key={interest} onClick={() => toggleInterest(interest)}>{interest}</button>)}</div></fieldset>
                <label>Travel style<select name="travel_style" value={form.travel_style} onChange={updateForm}><option value="budget">Budget-minded</option><option value="relaxed">Relaxed</option><option value="comfort">Comfort</option></select></label>
                <button className="primary-button" disabled={busy}>{busy ? 'TRAVII IS THINKING...' : 'PLAN MY TRIP  →'}</button>
              </form>
            </div>
            <div className="demo-panel"><div><p className="eyebrow">PRESENTATION MODE</p><h3>Show the agent at work</h3></div><div className="demo-actions"><button onClick={() => run('/api/demo/success')}>Success demo</button><button onClick={() => run('/api/demo/replan')}>Replan demo</button><button onClick={reset} aria-label="Reset">Reset</button></div></div>
          </aside>

          <section className="result-column">
            <div className="panel agent-panel"><div className="panel-heading"><div><p className="eyebrow">TRAVII AGENT</p><h2>{busy ? 'Working through your brief' : result ? 'Plan ready for review' : 'Waiting for a brief'}</h2></div>{busy && <span className="spinner" />}</div><div className="agent-track">{['Understanding', 'Planning', 'Using tools', 'Checking', 'Re-planning', 'Completed'].map((step) => <span className={activeEvent?.type?.toLowerCase().includes(step.split(' ')[0].toLowerCase()) || (step === 'Completed' && result && !busy) ? 'track-step active' : 'track-step'} key={step}><i />{step}</span>)}</div>{error && <div className="error-message">{error}</div>}<div className="event-list">{events.length ? events.map((event, index) => <div className={`event event-${event.type}`} key={`${event.type}-${index}`}><span>{event.type === 'warning' || event.type === 'replanning' ? '!' : event.type === 'completed' ? '✓' : '·'}</span><p>{event.message}<small>{event.tool ? event.tool : event.type.replace('_', ' ')}</small></p></div>) : <div className="empty-state">Your agent timeline will appear here when TRAVII starts working.</div>}</div></div>

            {result && <><div className="stat-grid"><Stat label="Estimated total" value={money(result.budget.total)} accent /><Stat label="Remaining" value={money(result.budget.remaining)} /><Stat label="Agent mode" value={result.mode === 'ai' ? 'OpenAI' : 'Demo data'} /></div><div className="content-grid"><div className="panel itinerary-panel"><div className="panel-heading"><div><p className="eyebrow">THE ROUTE</p><h2>{result.plan.origin} → {result.plan.destination}</h2></div><span className="status-pill">{result.budget.status === 'WITHIN_BUDGET' ? 'WITHIN BUDGET' : 'NEEDS REVIEW'}</span></div><p className="muted">{result.plan.days} days · {result.plan.travelers} traveler(s) · simulated availability</p><div className="days">{result.itinerary.map((day) => <article className="day" key={day.day}><div className="day-number">0{day.day}</div><div><h3>Day {day.day}</h3><p><b>Morning</b>{day.morning}</p><p><b>Afternoon</b>{day.afternoon}</p><p><b>Evening</b>{day.evening}</p></div></article>)}</div></div><div className="side-stack"><div className="panel budget-panel"><p className="eyebrow">BUDGET LEDGER</p><h2>{money(result.budget.total)}</h2>{['transport', 'hotel', 'food', 'activities'].map((item) => <div className="ledger-row" key={item}><span>{item}</span><strong>{money(result.budget[item])}</strong></div>)}<div className="ledger-total"><span>Budget</span><strong>{money(result.budget.budget)}</strong></div></div><div className="panel memory-panel"><p className="eyebrow">TRAVII MEMORY</p><h3>Preferences carried forward</h3><p>Style <b>{result.memory.travel_style}</b></p><p>Favorites <b>{result.memory.favorite_interests.join(', ')}</b></p><p>Transport <b>{result.memory.preferred_transport}</b></p></div></div></div>{result.replanned && <div className="replan-callout"><div className="callout-icon">↻</div><div><p className="eyebrow">REPLAN COMPLETE</p><h3>TRAVII found a better fit</h3><p>Initial estimate {money(result.initial_budget.total)} → revised estimate <b>{money(result.budget.total)}</b></p></div></div>}<div className="panel chat-panel"><div><p className="eyebrow">KEEP SHAPING IT</p><h2>Ask TRAVII</h2></div><form onSubmit={sendChat}><input value={chat} onChange={(event) => setChat(event.target.value)} placeholder="Make it cheaper, add a beach..." disabled={busy} /><button disabled={busy || !chat.trim()}>Send</button></form>{result.chat_reply && <p className="chat-reply">{result.chat_reply}</p>}</div><div className="approval"><div><p className="eyebrow">FINAL STEP</p><h2>Human approval required</h2><p>Review the simulated plan before TRAVII proceeds.</p></div>{approval ? <strong className={approval.status === 'approved' ? 'approved' : 'rejected'}>{approval.message}</strong> : <div className="approval-actions"><button onClick={() => approve('REJECT')}>Reject</button><button className="primary-button" onClick={() => approve('APPROVE')}>Approve simulation</button></div>}</div></>}
          </section>
        </section>
        {selectedPlace && <PlaceExplorer place={selectedPlace} onClose={() => setSelectedPlace(null)} onAdd={addPlace} />}
      </main>
      <footer>TRAVII uses simulated transport and hotel data. No real booking or payment is made.</footer>
    </div>
  )
}

function Stat({ label, value, accent }) { return <div className={accent ? 'stat accent-stat' : 'stat'}><span>{label}</span><strong>{value}</strong></div> }

export default App
