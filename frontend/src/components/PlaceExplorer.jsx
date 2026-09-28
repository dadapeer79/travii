import { useCallback, useState } from 'react'
import Travel3D from './Travel3D'

function PlaceExplorer({ place, onClose, onAdd }) {
  const [status, setStatus] = useState('Loading 3D world...')
  const updateStatus = useCallback((message) => setStatus(message), [])

  if (!place) return null

  return (
    <div className="explorer-backdrop" role="dialog" aria-modal="true" aria-label={`${place.name} explorer`}>
      <div className="explorer-panel">
        <div className="explorer-toolbar"><div><p className="eyebrow">TRAVII DESTINATION EXPLORER</p><h2>{place.name}</h2></div><button className="close-button" onClick={onClose} aria-label="Close explorer">×</button></div>
        <div className="explorer-layout">
          <Travel3D place={place} onStatus={updateStatus} />
          <aside className="explorer-details"><span className="status-pill">{status}</span><p className="eyebrow">{place.data_source || 'DEMO DATA'}</p><h3>{place.name}</h3><p className="place-location">{place.address || 'Location information unavailable'}</p><p className="place-meta">{place.type || 'Sightseeing'}{place.rating ? ` · ★ ${place.rating}` : ' · Rating unavailable'}</p><p>{place.description || 'Information unavailable.'}</p><div className="explorer-note">Google place photos appear here when permitted and available. <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`} target="_blank" rel="noreferrer">View real photos and map</a>.</div><div className="explorer-actions"><button className="primary-button" onClick={() => onAdd(place)}>Add to trip</button><button className="text-button" onClick={onClose}>Back to itinerary</button></div></aside>
        </div>
      </div>
    </div>
  )
}

export default PlaceExplorer
