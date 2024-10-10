export interface ThemeNode {
  node: Theme;
}

export interface ThemeResponse {
  themes: Theme[];
}

export interface Theme {
  id: string;
  name: string;
  role: "ARCHIVED" | "DEMO" | "DEVELOPMENT" | "LOCKED" | "MAIN" | "UNPUBLISHED";
}

export interface RoleTheme {
  id: string;
  name: string;
}
