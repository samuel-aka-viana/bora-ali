import { useEffect, useMemo, useRef, useState } from "react";

const TILE_SIZE = 256;
const DEFAULT_CENTER = { latitude: -3.1190275, longitude: -60.0217314 };
const MIN_ZOOM = 12;
const MAX_ZOOM = 18;

type LatLng = {
  latitude: number;
  longitude: number;
};

type Point = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

type Props = {
  label: string;
  hint: string;
  clearLabel: string;
  useCurrentLocationLabel: string;
  locatingLabel: string;
  geolocationUnavailableMessage: string;
  geolocationDeniedMessage: string;
  geolocationErrorMessage: string;
  zoomInLabel: string;
  zoomOutLabel: string;
  latitude?: string | null;
  longitude?: string | null;
  onChange: (coords: { latitude: string | null; longitude: string | null }) => void;
};

function toNumber(value?: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function latLngToPoint({ latitude, longitude }: LatLng, zoom: number): Point {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);

  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale,
  };
}

function pointToLatLng({ x, y }: Point, zoom: number): LatLng {
  const scale = TILE_SIZE * 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const latitudeRadians = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / scale)));

  return {
    latitude: (latitudeRadians * 180) / Math.PI,
    longitude,
  };
}

function formatCoord(value: number) {
  return value.toFixed(7);
}

export function LocationPicker({
  label,
  hint,
  clearLabel,
  useCurrentLocationLabel,
  locatingLabel,
  geolocationUnavailableMessage,
  geolocationDeniedMessage,
  geolocationErrorMessage,
  zoomInLabel,
  zoomOutLabel,
  latitude,
  longitude,
  onChange,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    centerPoint: Point;
    moved: boolean;
  } | null>(null);
  const [zoom, setZoom] = useState(15);
  const selected = useMemo(() => {
    const selectedLatitude = toNumber(latitude);
    const selectedLongitude = toNumber(longitude);

    return selectedLatitude !== null && selectedLongitude !== null
      ? { latitude: selectedLatitude, longitude: selectedLongitude }
      : null;
  }, [latitude, longitude]);
  const [center, setCenter] = useState<LatLng>(selected ?? DEFAULT_CENTER);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [locating, setLocating] = useState(false);
  const [geolocationError, setGeolocationError] = useState("");

  useEffect(() => {
    if (!selected) return;
    const timeout = window.setTimeout(() => setCenter(selected), 0);
    return () => window.clearTimeout(timeout);
  }, [selected]);

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;

    const syncSize = () => {
      setSize({ width: element.clientWidth, height: element.clientHeight });
    };

    syncSize();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(syncSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const centerPoint = useMemo(() => latLngToPoint(center, zoom), [center, zoom]);
  const topLeft = useMemo(
    () => ({
      x: centerPoint.x - size.width / 2,
      y: centerPoint.y - size.height / 2,
    }),
    [centerPoint, size],
  );

  const tiles = useMemo(() => {
    if (!size.width || !size.height) return [];

    const minTileX = Math.floor(topLeft.x / TILE_SIZE);
    const maxTileX = Math.floor((topLeft.x + size.width) / TILE_SIZE);
    const minTileY = Math.floor(topLeft.y / TILE_SIZE);
    const maxTileY = Math.floor((topLeft.y + size.height) / TILE_SIZE);
    const tileCount = 2 ** zoom;
    const nextTiles = [];

    for (let x = minTileX; x <= maxTileX; x += 1) {
      for (let y = minTileY; y <= maxTileY; y += 1) {
        if (y < 0 || y >= tileCount) continue;
        const wrappedX = ((x % tileCount) + tileCount) % tileCount;
        nextTiles.push({
          key: `${zoom}-${x}-${y}`,
          src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
          left: x * TILE_SIZE - topLeft.x,
          top: y * TILE_SIZE - topLeft.y,
        });
      }
    }

    return nextTiles;
  }, [size, topLeft, zoom]);

  const pinPosition = useMemo(() => {
    if (!selected) return null;
    const point = latLngToPoint(selected, zoom);
    return {
      left: point.x - topLeft.x,
      top: point.y - topLeft.y,
    };
  }, [selected, topLeft, zoom]);

  function updateLocationFromPointer(clientX: number, clientY: number) {
    const element = mapRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const point = {
      x: topLeft.x + clientX - rect.left,
      y: topLeft.y + clientY - rect.top,
    };
    const coords = pointToLatLng(point, zoom);
    onChange({
      latitude: formatCoord(coords.latitude),
      longitude: formatCoord(coords.longitude),
    });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setGeolocationError(geolocationUnavailableMessage);
      return;
    }

    setLocating(true);
    setGeolocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCenter(coords);
        onChange({
          latitude: formatCoord(coords.latitude),
          longitude: formatCoord(coords.longitude),
        });
        setLocating(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeolocationError(geolocationDeniedMessage);
        } else {
          setGeolocationError(geolocationErrorMessage);
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-text">{label}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="text-xs text-primary transition hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locating ? locatingLabel : useCurrentLocationLabel}
          </button>
          {selected && (
            <button
              type="button"
              onClick={() => onChange({ latitude: null, longitude: null })}
              className="text-xs text-muted transition hover:text-red-500"
            >
              {clearLabel}
            </button>
          )}
        </div>
      </div>
      <div
        ref={mapRef}
        role="application"
        aria-label={label}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            centerPoint,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;

          const deltaX = event.clientX - drag.startX;
          const deltaY = event.clientY - drag.startY;
          if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) drag.moved = true;

          setCenter(pointToLatLng({
            x: drag.centerPoint.x - deltaX,
            y: drag.centerPoint.y - deltaY,
          }, zoom));
        }}
        onPointerUp={(event) => {
          const drag = dragRef.current;
          dragRef.current = null;
          if (!drag || drag.pointerId !== event.pointerId) return;
          event.currentTarget.releasePointerCapture(event.pointerId);
          if (!drag.moved) updateLocationFromPointer(event.clientX, event.clientY);
        }}
        className="relative h-64 w-full touch-none overflow-hidden rounded-xl border border-border bg-surface"
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            draggable={false}
            className="absolute h-64 w-64 select-none"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
        {pinPosition && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: pinPosition.left, top: pinPosition.top }}
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg after:absolute after:-bottom-1 after:h-3 after:w-3 after:rotate-45 after:bg-primary">
              <svg viewBox="0 0 24 24" className="relative z-10 h-5 w-5 fill-none stroke-current stroke-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
          </div>
        )}
        <div className="absolute right-2 top-2 z-20 flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + 1))}
            className="flex h-8 w-8 items-center justify-center text-lg leading-none transition hover:bg-background"
            aria-label={zoomInLabel}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - 1))}
            className="flex h-8 w-8 items-center justify-center border-t border-border text-lg leading-none transition hover:bg-background"
            aria-label={zoomOutLabel}
          >
            -
          </button>
        </div>
        <div className="absolute bottom-1 right-2 z-20 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-muted">
          © OpenStreetMap
        </div>
      </div>
      <p className="text-xs text-muted">{hint}</p>
      {geolocationError && <p className="text-xs text-red-500">{geolocationError}</p>}
      {selected && (
        <p className="text-xs text-muted">
          {formatCoord(selected.latitude)}, {formatCoord(selected.longitude)}
        </p>
      )}
    </div>
  );
}
