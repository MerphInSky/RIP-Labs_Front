import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import { Link } from "react-router-dom";
import CartRow from "../../components/CartRow/CartRow";
import ComponentsList from "../../components/ComponentsList/ComponentsList";
import ComponentFilterBar from "../../components/ComponentFilterBar/ComponentFilterBar";
import { COMPONENTS_MOCK, filterMockComponentsByTitle } from "../../modules/mock";
import {
  fallbackImageUrl,
  listComponents,
  resolveMediaUrl,
  componentClipDescription,
  type ComponentJSON,
} from "../../modules/componentsApi";
import { useComponentImageSearch } from "../../hooks/useComponentImageSearch";
import "./ComponentsPage.css";

export default function ComponentsPage() {
  const [clipSourceComponents, setClipSourceComponents] = useState<ComponentJSON[]>([]);
  const [displayComponents, setDisplayComponents] = useState<ComponentJSON[]>([]);
  const [searchTitle, setSearchTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [clipSessionActive, setClipSessionActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (useMock) {
        if (!cancelled) {
          setClipSourceComponents(COMPONENTS_MOCK);
          setDisplayComponents(COMPONENTS_MOCK);
        }
        return;
      }
      try {
        const data = await listComponents();
        if (cancelled) return;
        if (data.length > 0) {
          setClipSourceComponents(data);
          setDisplayComponents(data);
        } else {
          setClipSourceComponents(COMPONENTS_MOCK);
          setDisplayComponents(COMPONENTS_MOCK);
          setUseMock(true);
        }
      } catch {
        if (cancelled) return;
        setClipSourceComponents(COMPONENTS_MOCK);
        setDisplayComponents(COMPONENTS_MOCK);
        setUseMock(true);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [useMock]);

  const clipItems = useMemo(
    () =>
      clipSourceComponents.map((s) => ({
        id: s.component_id,
        description: componentClipDescription(s),
      })),
    [clipSourceComponents],
  );

  const {
    items: clipProcessed,
    ready: clipReady,
    imageEmbedding,
    workerError,
    searchByImage,
    resetSearch,
  } = useComponentImageSearch(clipItems, clipSessionActive);

  const componentById = useMemo(() => {
    const m = new Map<number, ComponentJSON>();
    clipSourceComponents.forEach((s) => m.set(s.component_id, s));
    return m;
  }, [clipSourceComponents]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const filtered = await listComponents({ title: searchTitle });

      if (filtered.length > 0) {
        setDisplayComponents(filtered);
        setUseMock(false);
      } else {
        if (useMock) {
          setDisplayComponents(filterMockComponentsByTitle(searchTitle));
        } else {
          setDisplayComponents([]);
        }
      }
    } catch {
      setDisplayComponents(filterMockComponentsByTitle(searchTitle));
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadButtonClick = () => {
    if (!clipSessionActive) setClipSessionActive(true);
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      searchByImage(file);
    }
  };

  const handleClearImage = () => {
    if (selectedImage?.startsWith("blob:")) URL.revokeObjectURL(selectedImage);
    setSelectedImage(null);
    resetSearch();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const imageSearchActive = Boolean(imageEmbedding);
  const uploadLabel =
    clipSessionActive && !clipReady ? "Загрузка нейросети..." : "Загрузить фото";
  const isUploadDisabled = clipItems.length === 0 || (clipSessionActive && !clipReady);
  const canResetImage = Boolean(selectedImage);
  const visibleClipRows = imageSearchActive ? clipProcessed.filter((item) => item.isVisible) : [];

  return (
    <div className="components-page">
      <div className="toolbar components-page__unified-toolbar">
        <ComponentFilterBar
          query={searchTitle}
          onQueryChange={setSearchTitle}
          onSearch={handleSearch}
        />
        <section
          className="components-page__clip-toolbar clip-search-section"
          aria-label="Поиск стратегии по изображению"
        >
          {workerError ? (
            <Alert variant="success" className="clip-search-section__alert clip-search-section__alert--toolbar">
              Не удалось загрузить модель или обработать запрос: {workerError}
            </Alert>
          ) : null}

          {clipItems.length === 0 ? (
            <p className="clip-search-section__empty-catalog clip-search-section__empty-catalog--toolbar">
              Каталог…
            </p>
          ) : (
            <div className="clip-search-section__panel clip-search-section__panel--toolbar">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="clip-search-section__file-input"
                onChange={handleImageUpload}
              />

              <div className="clip-search-section__preview-wrap">
                {selectedImage ? (
                  <img src={selectedImage} alt="" className="clip-search-section__preview-image" />
                ) : (
                  <div className="clip-search-section__placeholder-image">Нет фото</div>
                )}
              </div>

              <div className="clip-search-section__action-panel clip-search-section__action-panel--toolbar">
                <Button
                  className="clip-search-section__btn-upload"
                  onClick={handleUploadButtonClick}
                  disabled={isUploadDisabled}
                >
                  {uploadLabel}
                </Button>

                <Button
                  variant="outline-success"
                  onClick={handleClearImage}
                  disabled={!canResetImage}
                >
                  Сбросить
                </Button>
              </div>
            </div>
          )}
        </section>
        <CartRow className="components-page__toolbar-cart" />
      </div>
      <div className="space">
        <main className="components-page__main">
          {loading ? (
            <div className="components-page__loading">
              <Spinner animation="border" role="status" aria-label="Загрузка">
                <span className="visually-hidden">Загрузка...</span>
              </Spinner>
            </div>
          ) : imageSearchActive ? (
            <div className="components-page__grid components-page__clip-results">
              {visibleClipRows.length === 0 ? (
                <div className="components-page__empty">
                  Нет стратегий выше порога сходства. Попробуйте другое изображение.
                </div>
              ) : (
                <ul className="clip-results-list">
                  {visibleClipRows.map((item) => {
                    const component = componentById.get(item.id);
                    if (!component) return null;
                    const thumb = resolveMediaUrl(component.photo_url) || fallbackImageUrl();
                    return (
                      <li key={item.id}>
                        <Link to={`/component/${item.id}`} className="clip-result-row">
                          <img src={thumb} alt="" className="clip-result-row__image" />
                          <div className="clip-result-row__content">
                            <h5>{component.title}</h5>
                            <p className="clip-result-row__en">{item.description}</p>
                            <p>{component.description}</p>
                          </div>
                          <div className="clip-result-row__stats">
                            <div>
                              Сходство:{" "}
                              <span className="clip-result-row__similarity">
                                {(item.score * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="components-page__grid">
              {displayComponents.length > 0 ? (
                <ComponentsList components={displayComponents} />
              ) : (
                <div className="components-page__empty">
                  {searchTitle.trim()
                    ? `По запросу «${searchTitle}» ничего не найдено`
                    : "Стратегии не найдены"}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
