import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPoiModel } from "@/types/map";
import { gcj02ToWgs84 } from "@/lib/coords";

// Fix Leaflet default marker icon paths in bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface DisplayPoint {
  poi: MapPoiModel;
  /** 渲染用坐标：已反解成 WGS-84，与 OSM 底图一致 */
  position: L.LatLngTuple;
}

function MapBoundsUpdater({ points }: { points: DisplayPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => p.position));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points, map]);

  return null;
}

interface MapViewProps {
  pois: MapPoiModel[];
  onMarkerClick?: (poi: MapPoiModel) => void;
  className?: string;
}

export function MapView({ pois, onMarkerClick, className }: MapViewProps) {
  const defaultCenter: L.LatLngTuple = [34.0159, 108.7505]; // 草堂校区

  // 库中存的是 GCJ-02（与 App 的高德底图同源），OSM 底图是 WGS-84，
  // 直接叠加会整体向东南偏约 500m，所以只在渲染时反解，存储值不动。
  const points = useMemo<DisplayPoint[]>(
    () =>
      pois
        .filter((p) => p.latitude && p.longitude)
        .map((poi) => ({
          poi,
          position: gcj02ToWgs84(poi.latitude, poi.longitude),
        })),
    [pois],
  );

  return (
    <div className={className}>
      <MapContainer
        center={defaultCenter}
        zoom={14}
        className="w-full h-full rounded-2xl"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsUpdater points={points} />
        {points.map(({ poi, position }) => (
          <Marker
            key={poi.id ?? `${poi.latitude}-${poi.longitude}`}
            position={position}
            eventHandlers={{
              click: () => onMarkerClick?.(poi),
            }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <h3 className="font-semibold text-sm">{poi.name}</h3>
                {poi.category && (
                  <p className="text-xs text-muted-foreground mt-0.5">{poi.category}</p>
                )}
                {poi.address && <p className="text-xs mt-1">{poi.address}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {poi.latitude.toFixed(6)}, {poi.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
