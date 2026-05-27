import type {
  ComponentJSON,
  HeatingCartJSON,
  HeatingDetailResponse,
} from "./componentsApi";
import d from "../assets/default_image.png";


export const COMPONENTS_MOCK: ComponentJSON[] = [
  {
    component_id: 1,
    is_deleted: false,
    title: "Микросхема BD9897FS",
    description: "Контроллер управления инвертором подсветки для ЖК-дисплеев в корпусе для поверхностного монтажа SOP-24",
    photo_url: d,
    video: d,
    thermal_resistance: 132,
    short_description_en:
      "Inverter backlight control controller",
  },
  {
    component_id: 2,
    is_deleted: false,
    title: "Транзистор FDD8447L",
    description: "N-канальный полевой транзистор для силовой коммутации в корпусе D-PAK для поверхностного монтажа",
    photo_url: d,
    video: d,
    thermal_resistance: 2,
    short_description_en: "Field transistor for power switching",
  },
  {
    component_id: 3,
    is_deleted: false,
    title: "Транзистор B1261",
    description: "Высокотоковый PNP-транзистор для усилителей мощности и схем управления в металлическом корпусе TO-3P",
    photo_url: d,
    video: d,
    thermal_resistance: 40,
    short_description_en: "High current transistor for power amplifiers",
  },
  {
    component_id: 4,
    is_deleted: false,
    title: "Транзисторная сборка AO4606C",
    description: "Комплементарная пара полевых транзисторов N- и P-канального типов в компактном корпусе SO-8 для поверхностного монтажа",
    photo_url: d,
    video: d,
    thermal_resistance: 300,
    short_description_en: "Complementary pair of field transistors",
  },
];

export const MOCK_CART: HeatingCartJSON = {
  has_draft: true,
  components_count: 2,
  id: 1,
};

export function getMockComponent(id: number): ComponentJSON | undefined {
  return COMPONENTS_MOCK.find((s) => s.component_id === id);
}

export function filterMockComponentsByTitle(title: string): ComponentJSON[] {
  const t = title.trim().toLowerCase();
  if (!t) return [...COMPONENTS_MOCK];
  return COMPONENTS_MOCK.filter((s) => s.title.toLowerCase().includes(t));
}

const CART_EVENT = "heating-cart-updated";

export async function addComponentToMockHeating(
  componentId: number,
): Promise<{ ok: true } | { ok: false; message?: string }> {
  void componentId;
  await new Promise((r) => setTimeout(r, 200));
  window.dispatchEvent(new Event(CART_EVENT));
  return { ok: true };
}

export function subscribeHeatingCart(listener: () => void): () => void {
  window.addEventListener(CART_EVENT, listener);
  return () => window.removeEventListener(CART_EVENT, listener);
}

export const MOCK_HEATING_DETAIL: HeatingDetailResponse = {
  heating: {
    heating_id: 1,
    status: "draft",
    created_at: new Date().toISOString(),
    creator_login: "demo",
    moderator_login: null,
    forming_date: null,
    finish_date: null,
    title: "Черновая заявка на расчёт нагрузки (mock).",
    ambient_temperature: 20,
    incomplete_items_count: 0,
  },
  components: [
    {
      heating_id: 1,
      component_id: 1,
      power_dissipation: 512,
      heat: 18.5,
      component: COMPONENTS_MOCK[0]!,
    },
    {
      heating_id: 1,
      component_id: 2,
      power_dissipation: 128,
      heat: 9.2,
      component: COMPONENTS_MOCK[0]!,
    },
  ],
};

export function cloneHeatingDetail(src: HeatingDetailResponse): HeatingDetailResponse {
  return JSON.parse(JSON.stringify(src)) as HeatingDetailResponse;
}
