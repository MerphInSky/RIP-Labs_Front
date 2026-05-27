import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { getMockComponent, COMPONENTS_MOCK } from "../../modules/mock";
import {
  fallbackImageUrl,
  getComponent,
  resolveMediaUrl,
  type ComponentJSON,
} from "../../modules/componentsApi";
import "./ComponentPage.css";

export default function ComponentPage() {
  const [component, setComponent] = useState<ComponentJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setMediaError(false);
      try {
        const data = await getComponent(Number(id));
        const resolved =
          data ?? getMockComponent(Number(id)) ?? COMPONENTS_MOCK.find((s) => s.component_id === Number(id)) ?? null;
        if (!cancelled) {
          setComponent(resolved);
        }
      } catch {
        const resolved =
          getMockComponent(Number(id)) ?? COMPONENTS_MOCK.find((s) => s.component_id === Number(id)) ?? null;
        if (!cancelled) {
          setComponent(resolved);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="component-page component-page--scroll">
        <div className="components-page__loading">
          <Spinner animation="border" />
        </div>
      </div>
    );
  }

  if (!id || !component) {
    return (
      <div className="component-page component-page--scroll">
        <div className="component-not-found">
          <h1>Компонент не найден</h1>
        </div>
      </div>
    );
  }

  const videoUrl = resolveMediaUrl(component.video);
  const posterUrl = resolveMediaUrl(component.photo_url) || fallbackImageUrl();
  const showVideo = Boolean(component.video?.trim()) && !mediaError;

  return (
    <div className="component-page component-page--scroll">
      <div className="component-video-card">
        <div className="component-video-frame">
          {showVideo ? (
            <video
              className="component-video-frame__media"
              controls
              autoPlay
              muted
              loop
              playsInline
              poster={posterUrl}
              onError={() => setMediaError(true)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <img className="component-video-frame__media" src={posterUrl} alt={component.title} />
          )}
          <div className="component-video-frame__shade" />
            <div className="component-video-overlay">
              <h1 className="component-video-overlay__title">{component.title}</h1>
              <div className="component-video-overlay__thermal-resistance">
                Тепловое сопротивление: {component.thermal_resistance.toFixed(1)}
              </div>
              <p className="component-video-overlay__description">{component.description}</p>
            </div>        </div>
      </div>
    </div>
  );
}
