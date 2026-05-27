import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner, Button, Form, Card, Row, Col, Badge } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchHeatingApplicationsList,
  finishHeatingApplication,
  setListFilters,
} from "../../store/slices/heatingApplicationSlice";
import { ROUTES } from "../../routePaths";
import "./HeatingsPage.css";

function statusLabel(s: string | undefined): string {
  const m: Record<string, string> = {
    draft: "Черновик",
    formed: "Сформирована",
    completed: "Завершена",
    rejected: "Отклонена",
    deleted: "Удалена",
  };
  return s ? (m[s] ?? s) : "—";
}

// ✅ Форматирование даты с временем в МОСКОВСКОЕ время
// ✅ Форматирование даты с временем (вычитаем 3 часа)
function formatMoscowDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    // Вычитаем 3 часа (переводим из московского в UTC)
    date.setHours(date.getHours() - 3);
    
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

// ✅ Форматирование только даты (без времени)
function formatMoscowDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    date.setHours(date.getHours() - 3);
    
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// Функция для получения цвета статуса
function getStatusVariant(status: string | undefined): string {
  switch (status) {
    case "draft":
      return "secondary";
    case "formed":
      return "primary";
    case "completed":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "light";
  }
}

export default function HeatingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isModerator } = useAppSelector((s) => s.user);
  const { list, listLoading, listError, filters, itemMutationLoading } = useAppSelector(
    (s) => s.heatingApplication,
  );
  const [creatorFilter, setCreatorFilter] = useState("");
  const [draftFrom, setDraftFrom] = useState(filters.fromDate);
  const [draftTo, setDraftTo] = useState(filters.toDate);
  const [draftStatus, setDraftStatus] = useState(filters.status);

  useEffect(() => {
    setDraftFrom(filters.fromDate);
    setDraftTo(filters.toDate);
    setDraftStatus(filters.status);
  }, [filters.fromDate, filters.toDate, filters.status]);

  const load = useCallback(() => {
    void dispatch(fetchHeatingApplicationsList());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
      return;
    }
    load();
    const id = window.setInterval(load, 4000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, navigate, load]);

  const visible = useMemo(() => {
    const q = creatorFilter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => (a.creator_login ?? "").toLowerCase().includes(q));
  }, [list, creatorFilter]);

  const handleApplyFilters = () => {
    dispatch(
      setListFilters({
        fromDate: draftFrom,
        toDate: draftTo,
        status: draftStatus,
      }),
    );
    void dispatch(fetchHeatingApplicationsList());
  };

  const goApp = (id: number) => {
    navigate(`/heating/${id}`);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="heatings-page">
      <div className="heatings-page__inner">
        <h1 className="heatings-page__heading">
          {isModerator ? "Заявки (модератор)" : "Мои заявки"}
        </h1>

        <section className="heatings-page__filters">
          <div className="heatings-page__filter-row">
            <Form.Group className="heatings-page__fg">
              <Form.Label>С даты</Form.Label>
              <Form.Control
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="heatings-page__fg">
              <Form.Label>По дату</Form.Label>
              <Form.Control
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="heatings-page__fg">
              <Form.Label>Статус</Form.Label>
              <Form.Select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
              >
                <option value="">Все</option>
                <option value="draft">Черновик</option>
                <option value="formed">Сформирована</option>
                <option value="completed">Завершена</option>
                <option value="rejected">Отклонена</option>
              </Form.Select>
            </Form.Group>
            {isModerator ? (
              <Form.Group className="heatings-page__fg heatings-page__fg--grow">
                <Form.Label>Создатель</Form.Label>
                <Form.Control
                  type="text"
                  value={creatorFilter}
                  onChange={(e) => setCreatorFilter(e.target.value)}
                  placeholder="Часть логина"
                />
              </Form.Group>
            ) : null}
          </div>
          <Button className="heatings-page__apply" onClick={handleApplyFilters}>
            Применить фильтры
          </Button>
        </section>

        {listError ? <div className="heatings-page__error">{listError}</div> : null}

        {listLoading && visible.length === 0 ? (
          <div className="heatings-page__loader">
            <Spinner animation="border" />
          </div>
        ) : null}

        {/* Карточки вместо таблицы */}
        <div className="heatings-page__cards">
          <Row xs={1} md={2} lg={2} xl={2} className="g-4">
            {visible.map((row) => {
              const id = row.heating_id;
              const finKey = `finish-${id}`;
              const finBusy = Boolean(itemMutationLoading[finKey]);
              
              return (
                <Col key={id}>
                  <Card className="heatings-page__card">
                    <Card.Body>
                      <div className="heatings-page__card-header">
                        <button
                          type="button"
                          className="heatings-page__linkish"
                          onClick={() => goApp(id)}
                        >
                          Заявка #{id}
                        </button>
                        <Badge bg={getStatusVariant(row.status)} pill>
                          {statusLabel(row.status)}
                        </Badge>
                      </div>

                      <div className="heatings-page__card-content">
                        <div className="heatings-page__card-row">
                          <span className="heatings-page__card-label">Создатель:</span>
                          <span className="heatings-page__card-value">{row.creator_login ?? "—"}</span>
                        </div>
                        
                        <div className="heatings-page__card-row">
                          <span className="heatings-page__card-label">Создана:</span>
                          <span className="heatings-page__card-value">
                            {row.created_at ? formatMoscowDateTime(row.created_at) : "—"}
                          </span>
                        </div>

                        <div className="heatings-page__card-row">
                          <span className="heatings-page__card-label">Формирование:</span>
                          <span className="heatings-page__card-value">
                            {row.forming_date ? formatMoscowDateOnly(row.forming_date) : "—"}
                          </span>
                        </div>

                        <div className="heatings-page__card-row">
                          <span className="heatings-page__card-label">Завершение:</span>
                          <span className="heatings-page__card-value">
                            {row.finish_date ? formatMoscowDateTime(row.finish_date) : "—"}
                          </span>
                        </div>

                        <div className="heatings-page__card-row">
                          <span className="heatings-page__card-label">Модератор:</span>
                          <span className="heatings-page__card-value">{row.moderator_login ?? "—"}</span>
                        </div>
                        <div className="heatings-page__card-row">
                          <span className="heatings-page__card-label">Количество непустых результатов</span>
                          <span className="heatings-page__card-value">{row.incomplete_items_count ?? "—"}</span>
                        </div>

                      </div>

                      {isModerator && row.status === "formed" && (
                        <div className="heatings-page__card-actions">
                          <Button
                            size="sm"
                            className="heatings-page__btn-finish"
                            disabled={finBusy}
                            onClick={() =>
                              void dispatch(
                                finishHeatingApplication({
                                  applicationId: id,
                                  status: "completed",
                                }),
                              )
                            }
                          >
                            Завершить
                          </Button>
                          <Button
                            size="sm"
                            className="heatings-page__btn-reject"
                            disabled={finBusy}
                            onClick={() =>
                              void dispatch(
                                finishHeatingApplication({
                                  applicationId: id,
                                  status: "rejected",
                                }),
                              )
                            }
                          >
                            Отклонить
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>

        {!listLoading && visible.length === 0 ? (
          <p className="heatings-page__empty">Нет заявок по текущим условиям.</p>
        ) : null}
      </div>
    </div>
  );
}














