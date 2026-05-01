import type { ImgHTMLAttributes } from "react";
import { useEffect, useState } from "react";

import { api } from "../../services/api";

type Props = ImgHTMLAttributes<HTMLImageElement>;
type LoadedImage = {
  requestUrl: string;
  objectUrl: string;
};

function apiMediaRequestUrl(src: string): string | null {
  try {
    const url = new URL(src, window.location.origin);
    if (!url.pathname.startsWith("/api/media/")) return null;
    return `${url.pathname.slice("/api".length)}${url.search}`;
  } catch {
    return src.startsWith("/api/media/")
      ? src.slice("/api".length)
      : null;
  }
}

export function AuthenticatedImage({ src, ...props }: Props) {
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const requestUrl = src ? apiMediaRequestUrl(src) : null;

  useEffect(() => {
    if (!requestUrl) return;

    let active = true;
    let nextObjectUrl: string | null = null;

    api
      .get<Blob>(requestUrl, { responseType: "blob" })
      .then((response) => {
        if (!active) return;
        nextObjectUrl = URL.createObjectURL(response.data);
        setLoadedImage({ requestUrl, objectUrl: nextObjectUrl });
      })
      .catch(() => {
        if (active) setLoadedImage(null);
      });

    return () => {
      active = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [requestUrl]);

  if (!src) return null;

  const imageSrc =
    requestUrl && loadedImage?.requestUrl === requestUrl
      ? loadedImage.objectUrl
      : src;

  return <img src={imageSrc} {...props} />;
}
