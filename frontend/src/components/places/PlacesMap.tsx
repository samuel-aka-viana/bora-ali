import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Place, PlaceStatus } from "../../types/place";

const TILE_SIZE = 256;
const DEFAULT_CENTER = { latitude: -3.1190275, longitude: -60.0217314 };
const MIN_ZOOM = 2;
const MAX_ZOOM = 18;
const MAP_PADDING = 72;

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

type MappedPlace = {
  place: Place;
  coords: LatLng;
};

const STATUS_COLORS: Record<PlaceStatus, string> = {
  want_to_visit: "#2563eb",
  visited: "#16a34a",
  favorite: "#d97706",
  would_not_return: "#dc2626",
};

const STATUS_LABELS: PlaceStatus[] = [
  "want_to_visit",
  "visited",
  "favorite",
  "would_not_return",
];

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

function getMappedPlaces(places: Place[]) {
  return places.flatMap((place) => {
    const latitude = toNumber(place.latitude);
    const longitude = toNumber(place.longitude);

    if (latitude === null || longitude === null) return [];

    return [{ place, coords: { latitude, longitude } }];
  });
}

function getCenter(mappedPlaces: MappedPlace[]): LatLng {
  if (mappedPlaces.length === 0) return DEFAULT_CENTER;

  const totals = mappedPlaces.reduce(
    (acc, item) => ({
      latitude: acc.latitude + item.coords.latitude,
      longitude: acc.longitude + item.coords.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: totals.latitude / mappedPlaces.length,
    longitude: totals.longitude / mappedPlaces.length,
  };
}

function getZoom(mappedPlaces: MappedPlace[], size: Size) {
  if (mappedPlaces.length <= 1 || !size.width || !size.height) return 15;

  for (let zoom = MAX_ZOOM; zoom >= MIN_ZOOM; zoom -= 1) {
    const points = mappedPlaces.map((item) => latLngToPoint(item.coords, zoom));
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));

    if (
      maxX - minX <= Math.max(size.width - MAP_PADDING * 2, TILE_SIZE) &&
      maxY - minY <= Math.max(size.height - MAP_PADDING * 2, TILE_SIZE)
    ) {
      return zoom;
    }
  }

  return MIN_ZOOM;
}

export function PlacesMap({ places }: { places: Place[] }) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    centerPoint: Point;
  } | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const mappedPlaces = useMemo(() => getMappedPlaces(places), [places]);
  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(15);
  const centerPoint = useMemo(() => latLngToPoint(center, zoom), [center, zoom]);
  const topLeft = useMemo(
    () => ({
      x: centerPoint.x - size.width / 2,
      y: centerPoint.y - size.height / 2,
    }),
    [centerPoint, size],
  );
  const mappedPlacesKey = useMemo(
    () => mappedPlaces.map((item) => item.place.public_id).join("|"),
    [mappedPlaces],
  );

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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCenter(getCenter(mappedPlaces));
      setZoom(getZoom(mappedPlaces, size));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [mappedPlaces, mappedPlacesKey, size]);

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

  const pins = useMemo(
    () =>
      mappedPlaces.map((item) => {
        const point = latLngToPoint(item.coords, zoom);
        return {
          ...item,
          left: point.x - topLeft.x,
          top: point.y - topLeft.y,
          color: STATUS_COLORS[item.place.status],
        };
      }),
    [mappedPlaces, topLeft, zoom],
  );
  const selectedPin = useMemo(
    () => pins.find((pin) => pin.place.public_id === selectedPlaceId) ?? null,
    [pins, selectedPlaceId],
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-text">
            {t("places.map.title")}
          </h2>
          <p className="text-sm text-muted">
            {t("places.map.count", { count: mappedPlaces.length })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_LABELS.map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              {t(`status.${status}`)}
            </span>
          ))}
        </div>
      </div>
      <div
        ref={mapRef}
        className="relative h-80 w-full cursor-grab touch-none overflow-hidden bg-background active:cursor-grabbing sm:h-96"
        aria-label={t("places.map.ariaLabel")}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setSelectedPlaceId(null);
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            centerPoint,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;

          setCenter(pointToLatLng({
            x: drag.centerPoint.x - (event.clientX - drag.startX),
            y: drag.centerPoint.y - (event.clientY - drag.startY),
          }, zoom));
        }}
        onPointerUp={(event) => {
          const drag = dragRef.current;
          dragRef.current = null;
          if (!drag || drag.pointerId !== event.pointerId) return;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
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
        {pins.map((pin) => (
          <button
            key={pin.place.public_id}
            type="button"
            className="absolute z-10 -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            style={{ left: pin.left, top: pin.top }}
            aria-label={t("places.map.showPlace", { name: pin.place.name })}
            title={pin.place.name}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedPlaceId(pin.place.public_id);
            }}
          >
            <span
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg"
              style={{ backgroundColor: pin.color }}
            >
              <span
                className="absolute -bottom-1 h-3 w-3 rotate-45"
                style={{ backgroundColor: pin.color }}
                aria-hidden="true"
              />
              <span
                className="relative z-10 h-3 w-3 rounded-full border-2 border-white"
                aria-hidden="true"
              />
            </span>
          </button>
        ))}
        {selectedPin && (
          <div
            className="absolute z-30 w-56 -translate-x-1/2 -translate-y-[calc(100%+3rem)] rounded-xl border border-border bg-surface p-3 text-left shadow-xl"
            style={{ left: selectedPin.left, top: selectedPin.top }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-fraunces text-base font-semibold text-text">
                  {selectedPin.place.name}
                </p>
                <p className="truncate text-xs text-muted">{selectedPin.place.category}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlaceId(null)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-lg leading-none text-muted transition hover:bg-background hover:text-text"
                aria-label={t("places.map.closePlace")}
              >
                ×
              </button>
            </div>
            {selectedPin.place.address && (
              <p className="mt-2 line-clamp-2 text-xs text-muted">{selectedPin.place.address}</p>
            )}
            <Link
              to={`/places/${selectedPin.place.public_id}`}
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
              aria-label={t("places.map.openPlace", { name: selectedPin.place.name })}
            >
              {t("common.open")}
            </Link>
          </div>
        )}
        {mappedPlaces.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center text-sm text-muted">
            {t("places.map.empty")}
          </div>
        )}
        <div
          className="absolute right-2 top-2 z-20 flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + 1))}
            className="flex h-8 w-8 items-center justify-center text-lg leading-none transition hover:bg-background"
            aria-label={t("places.map.zoomIn")}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - 1))}
            className="flex h-8 w-8 items-center justify-center border-t border-border text-lg leading-none transition hover:bg-background"
            aria-label={t("places.map.zoomOut")}
          >
            -
          </button>
        </div>
        <div className="absolute bottom-1 right-2 z-20 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-muted">
          © OpenStreetMap
        </div>
      </div>
    </section>
  );
}
