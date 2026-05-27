import { Link } from "react-router-dom";
import { useEffect, useState, type MouseEvent } from "react";
import {
  CART_UPDATED_EVENT,
  fallbackImageUrl,
  resolveMediaUrl,
  type ComponentJSON,
} from "../../modules/componentsApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addComponentToHeatingApplication } from "../../store/slices/heatingApplicationSlice";
import "./ComponentCard.css";

function photoSrc(photo_url: string, imageError: boolean): string {
  if (imageError || !photo_url?.trim()) return fallbackImageUrl();
  return resolveMediaUrl(photo_url);
}

export default function ComponentCard({ component }: { component: ComponentJSON }) {
  const dispatch = useAppDispatch();
  const applicationMutationLoading = useAppSelector(
    (s) => s.heatingApplication.applicationMutationLoading,
  );
  const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated);

  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(photoSrc(component.photo_url, false));

  useEffect(() => {
    setImageError(false);
    setImageUrl(photoSrc(component.photo_url, false));
  }, [component.photo_url]);

  const handleImageError = () => {
    setImageError(true);
    setImageUrl(fallbackImageUrl());
  };

  const handleAdd = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      return;
    }
    try {
      await dispatch(addComponentToHeatingApplication(component.component_id)).unwrap();
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
    } catch (err) {
      window.alert(String(err));
    }
  };

  const cardClassName = `card${!isAuthenticated ? " card--no-add-btn" : ""}`;

  return (
    <div className="card-wrapper">
      <Link to={`/component/${component.component_id}`} className={cardClassName}>
        <img
          src={imageError ? fallbackImageUrl() : imageUrl}
          alt={component.title}
          onError={handleImageError}
        />
        <div className="card__body">
          <h2 className="card__title">{component.title}</h2>
          <div className="card__thermal-resistance">
            <span className="card__thermal-resistance__value">
              Тепловое сопротивление: {component.thermal_resistance.toFixed(1)}
            </span>
          </div>
        </div>
      </Link>
      {isAuthenticated && (
        <button
          type="button"
          className="card-add-btn"
          onClick={handleAdd}
          disabled={applicationMutationLoading}
        >
          {applicationMutationLoading ? "Добавление…" : "Добавить в заявку"}
        </button>
      )}
    </div>
  );
}