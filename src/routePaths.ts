export const ROUTES = {
  COMPONENTS: "/",
  COMPONENT: "/component/:id",
  HEATING: "/heating/:id",
  HEATINGS: "/heatings",
  SIGN_IN: "/signin",
  SIGN_UP: "/signup",
  PROFILE: "/profile",
} as const;

export type RouteKeyType = keyof typeof ROUTES;

export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  COMPONENTS: "Каталог компонентов",
  COMPONENT: "Стратегия",
  HEATING: "Заявка",
  HEATINGS: "Заявки",
  SIGN_IN: "Вход",
  SIGN_UP: "Регистрация",
  PROFILE: "Личный кабинет",
};
