function PlaceCard({ place, onExplore, onAdd }) {
  const hasCoordinates = Number.isFinite(place.latitude) && Number.isFinite(place.longitude)
  const sourceLabel = place.data_source === 'REAL PLACE DATA' ? 'REAL PLACE DATA' : 'DEMO DATA'

  return (
    <article className="place-card">
      <div className="place-card-image" aria-hidden="true"><span>{place.type === 'Waterfall' ? 'W' : place.type === 'Wildlife' ? 'B' : 'N'}</span></div>
      <div className="place-card-body">
        <div className="place-card-topline"><span className="eyebrow">{sourceLabel}</span>{hasCoordinates && <span className="three-d-badge">3D READY</span>}</div>
        <h3>{place.name}</h3>
        <p className="place-location">{place.address || 'Location information unavailable'}</p>
        <p className="place-meta">{place.type || 'Sightseeing'}{place.rating ? ` · ★ ${place.rating}` : ' · Rating unavailable'}</p>
        <p className="place-description">{place.description || 'More information will be available when connected to Google Places.'}</p>
        <div className="place-actions">
          <button className="primary-button" onClick={() => onExplore(place)} disabled={!hasCoordinates}>Explore 3D</button>
          <button className="text-button" onClick={() => onAdd(place)}>Add to trip</button>
        </div>
      </div>
    </article>
  )
}

export default PlaceCard
