import { useEffect, useRef, useState } from 'react'
import 'cesium/Build/Cesium/Widgets/widgets.css'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (!GOOGLE_KEY) return Promise.reject(new Error('Google Maps browser key is not configured.'))
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-travii-google-maps]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps), { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const script = document.createElement('script')
    script.dataset.traviiGoogleMaps = 'true'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Google Maps could not be loaded.'))
    document.head.appendChild(script)
  })
}

function realMapUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`
}

function FallbackMessage({ place }) {
  return <div className="real-map-unavailable"><strong>Photorealistic 3D unavailable</strong><p>TRAVII will not draw a fake environment. Use a real Google map or place photos instead.</p><div className="real-map-actions"><a className="primary-button" href={realMapUrl(place)} target="_blank" rel="noreferrer">View real map</a><a className="text-button" href={realMapUrl(place)} target="_blank" rel="noreferrer">View photos on Google Maps</a></div></div>
}

function RealMapFallback({ place, onStatus }) {
  const mapElement = useRef(null)
  const [mapState, setMapState] = useState('loading')

  useEffect(() => {
    let cancelled = false
    loadGoogleMaps().then((maps) => {
      if (cancelled || !mapElement.current) return
      const map = new maps.Map(mapElement.current, { center: { lat: place.latitude, lng: place.longitude }, zoom: 13, mapTypeId: 'satellite', streetViewControl: false, fullscreenControl: true, mapTypeControl: true })
      new maps.Marker({ position: { lat: place.latitude, lng: place.longitude }, map, title: place.name })
      setMapState('ready')
      onStatus('Photorealistic 3D unavailable. Showing real satellite map.')
    }).catch(() => {
      if (!cancelled) {
        setMapState('unavailable')
        onStatus('Real map fallback unavailable. Use the external map link below.')
      }
    })
    return () => { cancelled = true }
  }, [onStatus, place])

  if (mapState === 'unavailable') return <FallbackMessage place={place} />
  return <div className="real-map-fallback"><div ref={mapElement} className="google-map-canvas" />{mapState === 'loading' && <div className="real-map-loading">Loading real satellite map...</div>}<div className="three-d-label"><span className="three-d-live-dot" />Real Google satellite map</div></div>
}

function Travel3D({ place, onStatus }) {
  const container = useRef(null)
  const viewer = useRef(null)
  const [mode, setMode] = useState('loading')
  const [message, setMessage] = useState('Preparing your destination...')
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    let disposed = false
    let activeViewer
    const update = (nextMessage) => { setMessage(nextMessage); onStatus(nextMessage) }

    const initialize = async () => {
      if (!place?.latitude || !place?.longitude) {
        setMode('unavailable')
        update('Photorealistic 3D unavailable: this place has no coordinates.')
        return
      }
      if (!GOOGLE_KEY) {
        setMode('unavailable')
        update('Photorealistic 3D unavailable: add a restricted browser key to enable it.')
        return
      }
      update('Loading real-world 3D environment...')
      try {
        const Cesium = await import('cesium')
        if (disposed || !container.current) return
        activeViewer = new Cesium.Viewer(container.current, { animation: false, baseLayerPicker: false, fullscreenButton: false, geocoder: false, homeButton: false, infoBox: false, sceneModePicker: false, selectionIndicator: false, timeline: false, navigationHelpButton: false, baseLayer: false, terrain: undefined })
        viewer.current = activeViewer
        activeViewer.scene.globe.show = false
        activeViewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#101a22')
        update(`Flying to ${place.name}...`)
        const tileset = await Cesium.Cesium3DTileset.fromUrl(`https://tile.googleapis.com/v1/3dtiles/root.json?key=${encodeURIComponent(GOOGLE_KEY)}`)
        if (disposed) return
        activeViewer.scene.primitives.add(tileset)
        activeViewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(place.longitude, place.latitude, 30), point: { pixelSize: 12, color: Cesium.Color.fromCssColorString('#f07b48'), outlineColor: Cesium.Color.WHITE, outlineWidth: 2 }, label: { text: place.name, font: '600 14px Manrope, sans-serif', fillColor: Cesium.Color.WHITE, showBackground: true, backgroundColor: Cesium.Color.fromCssColorString('#202a32cc'), pixelOffset: new Cesium.Cartesian2(0, -22) } })
        activeViewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(place.longitude, place.latitude, 1800), orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-42), roll: 0 }, duration: 2.4, complete: () => { if (!disposed) { setMode('cesium'); update('Photorealistic 3D loaded. Google credits are visible below.') } } })
      } catch (error) {
        if (!disposed) {
          setMode('fallback')
          update(error?.message?.includes('tile') ? 'Photorealistic 3D unavailable for this location. Use real map fallback.' : 'Photorealistic 3D could not be loaded. Use real map fallback.')
        }
      }
    }
    initialize()
    return () => { disposed = true; if (activeViewer && !activeViewer.isDestroyed()) activeViewer.destroy(); viewer.current = null }
  }, [onStatus, place])

  const resetView = async () => {
    if (!viewer.current || mode !== 'cesium') return
    const Cesium = await import('cesium')
    viewer.current.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(place.longitude, place.latitude, 1800), orientation: { heading: 0, pitch: Cesium.Math.toRadians(-42), roll: 0 }, duration: 1.2 })
  }

  if (showMap) return <div className="three-d-shell"><RealMapFallback place={place} onStatus={onStatus} /><button className="map-back-button" onClick={() => setShowMap(false)}>Back to 3D status</button></div>
  if (mode === 'unavailable') return <div className="three-d-shell"><FallbackMessage place={place} /></div>
  if (mode === 'fallback') return <div className="three-d-shell"><FallbackMessage place={place} /><button className="real-map-button" onClick={() => setShowMap(true)}>View real map</button></div>

  return <div className="three-d-shell cesium-shell"><div ref={container} className="cesium-canvas" /><div className="three-d-loading" aria-live="polite">{message}</div>{mode === 'cesium' && <button className="cesium-reset" onClick={resetView}>Reset view</button>}<div className="three-d-label"><span className="three-d-live-dot" />{mode === 'cesium' ? 'Photorealistic 3D' : 'Loading real 3D world'}</div></div>
}

export default Travel3D
