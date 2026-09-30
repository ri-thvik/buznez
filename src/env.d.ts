interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string;
  readonly VITE_API_URL?: string;
  readonly NODE_ENV?: string;
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
