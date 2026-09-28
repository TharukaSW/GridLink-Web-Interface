/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_TITLE?: string;
  readonly VITE_DEFAULT_MAP_LAT?: string;
  readonly VITE_DEFAULT_MAP_LNG?: string;
  readonly VITE_DEFAULT_MAP_ZOOM?: string;
  readonly VITE_DEFAULT_NEARBY_RADIUS_KM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
