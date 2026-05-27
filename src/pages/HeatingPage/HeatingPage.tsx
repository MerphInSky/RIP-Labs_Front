import { useCallback, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate, useParams } from "react-router-dom";
import { cloneHeatingDetail, MOCK_HEATING_DETAIL } from "../../modules/mock";
import {
  fallbackImageUrl,
  resolveMediaUrl,
  type HeatingComponentDetailJSON,
} from "../../modules/componentsApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  deleteHeatingApplication,
  fetchHeatingApplicationDetail,
  formHeatingApplication,
  removeHeatingComponentLine,
  updateHeatingComponentLine,
} from "../../store/slices/heatingApplicationSlice";
import "./HeatingPage.css";

type RowDraft = Pick<HeatingComponentDetailJSON, "power_dissipation" | "heat">;

export default function HeatingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.user);
  const { detail, detailLoading, detailError, applicationMutationLoading, itemMutationLoading } =
    useAppSelector((s) => s.heatingApplication);

  const [mockData, setMockData] = useState<typeof detail>(null);
  const [ambientTemperatureDraft, setAmbientTemperatureDraft] = useState<number | null>(null);
  // Состояние для отображения значения после нажатия кнопки "Сохранить"
  const [savedAmbientDisplay, setSavedAmbientDisplay] = useState<string>("—");
  const [rowDrafts, setRowDrafts] = useState<Record<number, RowDraft>>({});

  const reloadMock = useCallback(() => {
    if (!id) return;
    const n = Number(id);
    if (n === MOCK_HEATING_DETAIL.heating.heating_id) {
      setMockData(cloneHeatingDetail(MOCK_HEATING_DETAIL));
    } else {
      setMockData(null);
    }
  }, [id]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    setMockData(null);
    void dispatch(fetchHeatingApplicationDetail(Number(id))).then((a) => {
      if (fetchHeatingApplicationDetail.rejected.match(a)) {
        reloadMock();
      }
    });
  }, [id, isAuthenticated, dispatch, reloadMock]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const data = detail ?? mockData;

  useEffect(() => {
    if (!data) return;
    const serverTemp = data.heating.ambient_temperature;
    setAmbientTemperatureDraft(serverTemp ?? null);
    // Инициализируем отображаемое значение при загрузке
    setSavedAmbientDisplay(serverTemp !== null && serverTemp !== undefined ? serverTemp.toString() : "—");
    
    const next: Record<number, RowDraft> = {};
    data.components.forEach((row) => {
      next[row.component_id] = {
        power_dissipation: row.power_dissipation,
        heat: row.heat,
      };
    });
    setRowDrafts(next);
  }, [data]);

  const app = data?.heating;
  const applicationId = app?.heating_id;
  const isDraft = app?.status === "draft";
  const busy = applicationMutationLoading || detailLoading;

  const updateRowDraft = useCallback((componentId: number, patch: Partial<RowDraft>) => {
    setRowDrafts((prev) => {
      const base = prev[componentId] ?? {
        power_dissipation: 0,
        heat: null as number | null,
      };
      return {
        ...prev,
        [componentId]: { ...base, ...patch },
      };
    });
  }, []);

  const lineBusyKey = (sid: number) =>
    Boolean(itemMutationLoading[`line-${sid}-${applicationId ?? 0}`]);
  const rmBusy = (sid: number) => Boolean(itemMutationLoading[`rm-${sid}`]);

  // 🔹 Обновлённая функция: просто фиксирует значение для отображения
  const handleSaveAmbientTemperature = () => {
    if (!isDraft) return;
    const val = ambientTemperatureDraft === null ? "" : ambientTemperatureDraft.toString();
    setSavedAmbientDisplay(val);
  };

  const handleSaveRow = (componentId: number) => {
    if (!applicationId || !isDraft || mockData) return;
    const d = rowDrafts[componentId];
    if (!d) return;
    void dispatch(
      updateHeatingComponentLine({
        componentId,
        heatingId: applicationId,
        body: {
          heating_id: applicationId,
          component_id: componentId,
          power_dissipation: d.power_dissipation,
          heat: d.heat,
        },
      }),
    );
  };

  const handleRemoveRow = (componentId: number) => {
    if (!applicationId || !isDraft || mockData) return;
    if (!window.confirm("Убрать стратегию из заявки?")) return;
    void dispatch(removeHeatingComponentLine({ componentId, heatingId: applicationId }));
  };

  const handleForm = () => {
    if (!applicationId || !isDraft || mockData) return;
    void dispatch(formHeatingApplication(applicationId));
  };

  const handleDeleteApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !isDraft) return;
    if (!window.confirm("Удалить заявку?")) return;
    if (mockData) {
      navigate("/", { replace: true });
      return;
    }
    void dispatch(deleteHeatingApplication(applicationId)).then(() => {
      navigate("/", { replace: true });
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (detailLoading && !data) {
    return (
      <div className="heating-page">
        <div className="components-page__loading">
          <Spinner animation="border" />
        </div>
      </div>
    );
  }

  if (!data || !app || applicationId == null) {
    return (
      <div className="heating-page">
        <p className="application-not-found">
          {detailError ? detailError : "Заявка не найдена."}
        </p>
      </div>
    );
  }

  return (
    <div className="heating-page">
      {busy ? (
        <div className="heating-page__blocking" aria-live="polite">
          <Spinner animation="border" size="sm" /> Обработка…
        </div>
      ) : null}
      <div className={`heating-detail ${busy ? "heating-detail--blocked" : ""}`}>
        <div className="heating-detail__header-card">
          <h1 className="heating-detail__title">Заявка на расчёт нагрева</h1>
          <div className="heating-detail__info">
            <div className="heating-detail__info-item">
              <strong>ID заявки:</strong> {applicationId}
            </div>
            <div className="heating-detail__info-item">
              <strong>Статус:</strong> {app.status}
            </div>
            <div className="heating-detail__info-item">
              <strong>Компонентов в заявке:</strong> {data.components.length}
            </div>
          </div>
          <Form.Group className="heating-page__ambient-temperature" controlId="ambient-temperature">
            <Form.Label>Введите температуру охлаждения:</Form.Label>
            <Form.Control
              type="number"
              step={0.1}
              value={ambientTemperatureDraft === null ? "" : ambientTemperatureDraft}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setAmbientTemperatureDraft(null);
                  return;
                }
                const n = Number(v);
                setAmbientTemperatureDraft(Number.isFinite(n) ? n : null);
              }}
              placeholder="Введите температуру охлаждения..."
              disabled={!isDraft || Boolean(mockData)}
            />
          </Form.Group>
          
          {/* 🔹 Отображение зафиксированного значения */}
          <div style={{ marginTop: '4px', marginBottom: '8px', fontSize: '0.9rem', color: '#444', fontWeight: 500 }}>
            Температура охлаждения в гр C: {savedAmbientDisplay}
          </div>

          {isDraft && !mockData ? (
            <div className="heating-page__method-actions">
              <button
                type="button"
                className="heating-page__method-btn"
                disabled={busy}
                onClick={handleSaveAmbientTemperature}
              >
                Сохранить температуру
              </button>
              <button
                type="button"
                className="heating-page__method-btn heating-page__method-btn--accent"
                disabled={busy}
                onClick={handleForm}
              >
                Сформировать заявку
              </button>
            </div>
          ) : null}
        </div>

        <table className="load-table">
          <thead>
            <tr>
              <th className="load-table__col-photo">Изображение</th>
              <th>Компонент</th>
              <th>Рассеивающая мощность</th>
              <th>Нагрев</th>
              {isDraft ? <th>Действия со строкой (м-м)</th> : null}
            </tr>
          </thead>
          <tbody>
            {data.components.map((row) => {
              const photo = resolveMediaUrl(row.component.photo_url) || fallbackImageUrl();
              const draft = rowDrafts[row.component_id];
              return (
                <tr key={`${row.heating_id}-${row.component_id}`}>
                  <td className="load-table__col-photo">
                    <img src={photo} alt={row.component.title} />
                  </td>
                  <td>{row.component.title}</td>
                  <td>
                    <Form.Control
                      type="number"
                      min={0}
                      className="load-table__input"
                      value={draft?.power_dissipation ?? row.power_dissipation}
                      disabled={!isDraft}
                      onChange={(e) =>
                        updateRowDraft(row.component_id, {
                          power_dissipation: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td className="load-table__col-result">
                    <Form.Control
                      type="number"
                      min={0}
                      step={0.1}
                      className="load-table__input load-table__input--accent"
                      value={
                        draft?.heat === null || draft?.heat === undefined
                          ? ""
                          : draft.heat
                      }
                      placeholder="—"
                      disabled={!isDraft}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          updateRowDraft(row.component_id, { heat: null });
                          return;
                        }
                        const n = Number(v);
                        updateRowDraft(row.component_id, {
                          heat: Number.isFinite(n) ? n : null,
                        });
                      }}
                    />
                  </td>
                  {isDraft ? (
                    <td className="load-table__actions">
                      <button
                        type="button"
                        className="heating-page__row-btn"
                        disabled={busy || lineBusyKey(row.component_id) || Boolean(mockData)}
                        onClick={() => handleSaveRow(row.component_id)}
                      >
                        Сохранить строку
                      </button>
                      <button
                        type="button"
                        className="heating-page__row-btn heating-page__row-btn--danger"
                        disabled={busy || rmBusy(row.component_id) || Boolean(mockData)}
                        onClick={() => handleRemoveRow(row.component_id)}
                      >
                        Удалить из заявки
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>

        {isDraft ? (
          <form className="heating-page__delete-form" onSubmit={handleDeleteApplication}>
            <button type="submit" className="btn-delete" disabled={busy || Boolean(mockData)}>
              Удалить заявку
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}