import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import PropertyCard from './PropertyCard'
import { useEffect } from 'react'

// Fix generic map marker icon issue with Leaflet and bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function PropertyMap({ properties }) {
  // Center on Nigeria (approx)
  const defaultCenter = [9.0820, 8.6753]
  
  // Try to center on the first property with coordinates
  const firstWithCoords = properties.find(p => p.latitude && p.longitude)
  const center = firstWithCoords 
    ? [firstWithCoords.latitude, firstWithCoords.longitude] 
    : defaultCenter

  const validProperties = properties.filter(p => p.latitude && p.longitude)

  return (
    <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-gray-100 shadow-sm relative z-0">
      <MapContainer 
        center={center} 
        zoom={firstWithCoords ? 12 : 6} 
        scrollWheelZoom={false}
        className="h-full w-full absolute inset-0 z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {validProperties.map(property => (
          <Marker 
            key={property.id} 
            position={[property.latitude, property.longitude]}
          >
            <Popup className="property-popup">
              <div className="w-64 -m-3">
                <PropertyCard property={property} />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend / Info box overlay */}
      <div className="absolute bottom-4 right-4 z-[400] bg-white p-3 rounded-lg shadow-md text-xs border border-gray-100">
        <p className="font-medium text-gray-800 mb-1">Interactive Map</p>
        <p className="text-gray-500">Showing {validProperties.length} of {properties.length} properties</p>
      </div>
    </div>
  )
}
