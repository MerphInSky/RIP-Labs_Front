export interface ComponentJSON {
  component_id: number;
  is_deleted: boolean;
  title: string;
  description: string;
  photo_url: string;
  video: string;
  thermal_resistance: number;
  short_description_en?: string;
}

export interface HeatingCartJSON {
  has_draft: boolean;
  components_count: number;
  incomplete_items_count?: number;
  id?: number;
}

export interface HeatingJSON {
  heating_id: number;
  status: string;
  created_at: string;
  creator_login: string;
  moderator_login?: string | null;
  forming_date?: string | null;
  finish_date?: string | null;
  title?: string | null;
  incomplete_items_count: number;
  ambient_temperature: number;
}

export interface HeatingComponentDetailJSON {
  heating_id: number;
  component_id: number;
  power_dissipation: number;
  heat: number | null;
  component: ComponentJSON;
}

export interface HeatingDetailResponse {
  heating: HeatingJSON;
  components: HeatingComponentDetailJSON[];
}