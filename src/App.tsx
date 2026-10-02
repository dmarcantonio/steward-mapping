import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { buildDataset } from './data/loadWorksites'
import type { Worksite } from './types'

const { worksites, unmapped } = buildDataset()
if (unmapped.length) {
  console.warn(`${unmapped.length} address(es) have no geocode match:`, unmapped)
}

const VICTORIA: [number, number] = [48.4284, -123.3656]

const memberCount = (w: Worksite): number =>
  w.totals?.members ?? w.ministries.reduce((sum, m) => sum + m.members, 0)

const radius = (w: Worksite): number =>
  Math.min(24, 4 + Math.sqrt(memberCount(w)) * 0.6)

export default function App() {
  const bounds = worksites.map((w) => [w.lat, w.lng] as [number, number])
  const view = bounds.length
    ? { bounds, boundsOptions: { padding: [40, 40] as [number, number] } }
    : { center: VICTORIA, zoom: 13 }

  return (
    <>
      <MapContainer {...view} className="map">
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {worksites.map((w) => (
          <CircleMarker
            key={w.id}
            center={[w.lat, w.lng]}
            radius={radius(w)}
            pathOptions={{ color: '#0b4f4a', weight: 1.5, fillColor: '#14b8a6', fillOpacity: 0.6 }}
          >
            <Popup minWidth={280} maxWidth={420}>
              <pre className="popup-json">{JSON.stringify(w, null, 2)}</pre>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="status">
        {worksites.length} worksites mapped
        {unmapped.length > 0 && `, ${unmapped.length} without coordinates (see console)`}
      </div>
    </>
  )
}
