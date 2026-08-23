import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, ScaleControl, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const isCoord = (place) =>
  Number.isFinite(Number(place?.lat)) && Number.isFinite(Number(place?.lng));

const toLatLng = (place) => [Number(place.lat), Number(place.lng)];

const sameSpot = (a, b) =>
  a &&
  b &&
  Math.abs(Number(a.lat) - Number(b.lat)) < 0.0008 &&
  Math.abs(Number(a.lng) - Number(b.lng)) < 0.0008;

const markerIcon = (kind, glyph, label) =>
  L.divIcon({
    className: "map-pin-wrap",
    html: `<div class="map-pin-stack">
      <div class="map-label">${label}</div>
      <div class="map-pin ${kind}"><i>${glyph}</i></div>
    </div>`,
    iconSize: [160, 58],
    iconAnchor: [80, 52],
    popupAnchor: [0, -46],
  });

function FitToRoute({ points }) {
  const map = useMap();
  const key = points.map((point) => point.join(",")).join("|");

  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize());
    if (!points.length) return () => cancelAnimationFrame(frame);
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(points, { padding: [56, 56], maxZoom: 14, animate: true });
    }
    const later = setTimeout(() => map.invalidateSize(), 200);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(later);
    };
  }, [map, key]);

  return null;
}

async function fetchRoadRoute(stops) {
  const unique = [];
  for (const stop of stops) {
    const next = `${stop[1].toFixed(5)},${stop[0].toFixed(5)}`;
    if (unique[unique.length - 1] !== next) unique.push(next);
  }
  if (unique.length < 2) return null;

  const url = `https://router.project-osrm.org/route/v1/driving/${unique.join(";")}?overview=full&geometries=geojson&alternatives=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Route request failed");
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;
  return {
    path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    km: route.distance / 1000,
    minutes: route.duration / 60,
  };
}

const placeLine = (place) =>
  [place?.address, place?.area, place?.city].filter(Boolean).join(", ");

export default function RouteMap({ pickup, delivery, current, label, jobs = [] }) {
  const pickups = useMemo(() => {
    if (jobs.length) {
      return jobs
        .filter((job) => isCoord(job.pickup))
        .map((job) => ({
          id: job._id,
          place: job.pickup,
          current: job.currentLocation,
          status: job.status,
          driver: job.driver,
        }));
    }
    return isCoord(pickup) ? [{ id: "pickup", place: pickup, current, status: "", driver: null }] : [];
  }, [jobs, pickup, current]);

  const mart = isCoord(delivery) ? delivery : null;
  const live = current && isCoord(current) ? current : pickups.find((item) => isCoord(item.current))?.current;

  const [road, setRoad] = useState(null);

  const fallbackLine = useMemo(() => {
    const line = [];
    pickups.forEach((item) => line.push(toLatLng(item.place)));
    if (live) line.push(toLatLng(live));
    if (mart) line.push(toLatLng(mart));
    return line;
  }, [pickups, live, mart]);

  useEffect(() => {
    let cancelled = false;
    const stops = [];
    pickups.forEach((item) => stops.push(toLatLng(item.place)));
    if (live) stops.push(toLatLng(live));
    if (mart) stops.push(toLatLng(mart));
    if (stops.length < 2) {
      setRoad(null);
      return undefined;
    }

    fetchRoadRoute(stops)
      .then((result) => {
        if (!cancelled) setRoad(result);
      })
      .catch(() => {
        if (!cancelled) setRoad(null);
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackLine.join("|")]);

  const path = road?.path?.length ? road.path : fallbackLine;
  const fitPoints = [
    ...pickups.map((item) => toLatLng(item.place)),
    ...(live ? [toLatLng(live)] : []),
    ...(mart ? [toLatLng(mart)] : []),
  ];

  const center = fitPoints[0] || [27.7172, 85.324];

  return (
    <div className="map-shell">
      <div className="map">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom
          zoomControl
          className="map-canvas"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
          <ScaleControl imperial={false} position="bottomleft" />
          <FitToRoute points={fitPoints} />
          {path.length > 1 && (
            <>
              <Polyline positions={path} pathOptions={{ color: "#1c1915", weight: 8, opacity: 0.16 }} />
              <Polyline positions={path} pathOptions={{ color: "#c45c26", weight: 5, opacity: 0.96 }} />
            </>
          )}
          {pickups.map((item) => (
            <Marker
              key={item.id}
              position={toLatLng(item.place)}
              icon={markerIcon("farm", "F", `Pickup · ${item.place.area || item.place.name || "Farm"}`)}
            >
              <Popup>
                <strong>{item.place.name || "Farm pickup"}</strong>
                <div>{placeLine(item.place)}</div>
                {item.place.phone && <div>{item.place.phone}</div>}
              </Popup>
            </Marker>
          ))}
          {mart && (
            <Marker
              position={toLatLng(mart)}
              icon={markerIcon("mart", "M", `Mart · ${mart.area || mart.name || "Store"}`)}
            >
              <Popup>
                <strong>{mart.name || "Mart"}</strong>
                <div>{placeLine(mart)}</div>
                {mart.phone && <div>{mart.phone}</div>}
              </Popup>
            </Marker>
          )}
          {live &&
            !pickups.some((item) => sameSpot(live, item.place)) &&
            !sameSpot(live, mart) && (
            <Marker
              position={toLatLng(live)}
              icon={markerIcon("truck", "●", label || "Goods")}
              zIndexOffset={400}
            >
              <Popup>
                <strong>{label || "Goods in transit"}</strong>
                <div>{Number(live.lat).toFixed(5)}, {Number(live.lng).toFixed(5)}</div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      <div className="map-caption">
        <div className="map-keys">
          <span><i className="farm" /> Farm pickup</span>
          <span><i className="truck" /> Live goods</span>
          <span><i className="mart" /> Mart delivery</span>
        </div>
        <div className="map-stats">
          {road
            ? `${road.km.toFixed(1)} km by road · about ${Math.max(1, Math.round(road.minutes))} min`
            : path.length > 1
              ? "Showing the path between stops"
              : "Waiting for locations"}
        </div>
      </div>
    </div>
  );
}
