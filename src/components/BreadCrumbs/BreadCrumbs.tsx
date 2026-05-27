import { useEffect, useState } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { getMockComponent } from "../../modules/mock";
import { getComponent } from "../../modules/componentsApi";
import { ROUTES } from "../../routePaths";
import "./BreadCrumbs.css";

type Crumb = { label: string; to?: string };

export default function BreadCrumbs() {
  const { pathname } = useLocation();
  const [componentTitle, setComponentTitle] = useState<string | null>(null);

  useEffect(() => {
    const m = matchPath(ROUTES.COMPONENT, pathname);
    const rawId = m?.params.id;
    if (rawId == null) {
      setComponentTitle(null);
      return;
    }
    const id = Number(rawId);
    let cancelled = false;
    const run = async () => {
      const data = await getComponent(id);
      if (cancelled) return;
      if (data?.title) {
        setComponentTitle(data.title);
        return;
      }
      const s = getMockComponent(id);
      setComponentTitle(s?.title ?? `Компонент ${id}`);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const crumbs: Crumb[] = (() => {
    if (pathname === "/" || pathname === "") {
      return [{ label: "Главная" }];
    }

    if (pathname === ROUTES.SIGN_IN) {
      return [{ label: "Главная", to: "/" }, { label: "Вход" }];
    }

    if (pathname === ROUTES.SIGN_UP) {
      return [{ label: "Главная", to: "/" }, { label: "Регистрация" }];
    }

    if (pathname === ROUTES.HEATINGS) {
      return [{ label: "Главная", to: "/" }, { label: "Заявки" }];
    }

    if (pathname === ROUTES.PROFILE) {
      return [{ label: "Главная", to: "/" }, { label: "Личный кабинет" }];
    }

    const compMatch = matchPath(ROUTES.COMPONENT, pathname);
    if (compMatch?.params.id) {
      const title =
        componentTitle ??
        (compMatch.params.id ? `Компонент ${compMatch.params.id}` : "Компонент");
      return [{ label: "Главная", to: "/" }, { label: title }];
    }

    const loadMatch = matchPath(ROUTES.HEATING, pathname);
    if (loadMatch?.params.id) {
      return [
        { label: "Главная", to: "/" },
        { label: `Заявка №${loadMatch.params.id}` },
      ];
    }

    return [{ label: "Главная", to: "/" }, { label: "Страница" }];
  })();

  return (
    <nav className="app-breadcrumbs" aria-label="Навигационная цепочка">
      <ol className="app-breadcrumbs__list">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="app-breadcrumbs__item">
              {crumb.to != null && !last ? (
                <Link to={crumb.to} className="app-breadcrumbs__link">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={last ? "app-breadcrumbs__current" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
