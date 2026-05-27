import axios from "axios";
import type { ComponentJSON } from "./componentsApi.types";

export type {
  ComponentJSON,
  HeatingCartJSON,
  HeatingJSON,
  HeatingComponentDetailJSON,
  HeatingDetailResponse,
} from "./componentsApi.types";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/** Список и карточка стратегий (услуги / шардирование): только axios, без swagger-клиента. */
export const componentsAxios = axios.create({
  baseURL,
});

/**
 * База для ключей MinIO (не http/https/blob/data).
 * В dev по умолчанию через reverse proxy Vite: `/object-media` → localhost:9000 (см. vite.config.ts).
 * Для продакшена задайте VITE_MINIO_PUBLIC_BASE (например полный URL бакета или CDN).
 */
const MINIO_PUBLIC_BASE =
  (import.meta.env.VITE_MINIO_PUBLIC_BASE?.replace(/\/$/, "") as string | undefined) ??
  (import.meta.env.DEV ? "/object-media/test" : "http://localhost:9000/test");

export const CART_UPDATED_EVENT = "heating-cart-updated";

export function componentClipDescription(component: ComponentJSON): string {
  const en = component.short_description_en?.trim();
  if (en) return en;
  return "Common component.";
}

export function fallbackImageUrl(): string {
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="100%" height="100%" fill="#111820"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#5d6c74" font-family="sans-serif" font-size="14">Нет изображения</text></svg>',
    )
  );
}

export function resolveMediaUrl(key: string): string {
  if (!key?.trim()) return fallbackImageUrl();
  if (
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/") ||
    key.startsWith("blob:") ||
    key.startsWith("data:")
  ) {
    return key;
  }
  return `${MINIO_PUBLIC_BASE}/${key.replace(/^\//, "")}`;
}

export async function listComponents(params?: { title?: string }): Promise<ComponentJSON[]> {
  try {
    const r = await componentsAxios.get<ComponentJSON[]>("/components", {
      params: params?.title ? { Title: params.title } : undefined,
      headers: { Accept: "application/json" },
    });
    return r.data ?? [];
  } catch {
    return [];
  }
}

export async function getComponent(id: number): Promise<ComponentJSON | null> {
  try {
    const r = await componentsAxios.get<ComponentJSON>(`/components/${id}`, {
      headers: { Accept: "application/json" },
    });
    return r.data ?? null;
  } catch {
    return null;
  }
}
