import { Link } from "react-router-dom";
import type { Place } from "../../types/place";
import { Badge } from "../ui/Badge";

export function PlaceCard({ place, index = 0 }: { place: Place; index?: number }) {
  return (
    <Link to={`/places/${place.public_id}`}>
      <div
        className="bg-surface rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden group animate-fade-slide-up"
        style={{ animationDelay: `${index * 55}ms` }}
      >
        <div className="relative overflow-hidden">
          {place.cover_photo ? (
            <>
              <img
                src={place.cover_photo}
                alt={place.name}
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-3">
                <Badge status={place.status} />
              </div>
            </>
          ) : (
            <div className="w-full h-44 bg-gradient-to-br from-background to-border/60 flex items-center justify-center">
              <span className="text-4xl opacity-20">🍽</span>
              <div className="absolute bottom-2.5 left-3">
                <Badge status={place.status} />
              </div>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-fraunces font-semibold text-[1.05rem] leading-snug truncate text-text">
            {place.name}
          </h3>
          <p className="text-muted text-sm mt-0.5">{place.category}</p>
          {place.address && (
            <p className="text-muted text-xs mt-1 truncate">{place.address}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
