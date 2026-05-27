import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import { useAppSelector } from "../../store/hooks";
import { parseJwtPayload } from "../../store/utils/jwt";
import { ROUTES } from "../../routePaths";
import "../SignInPage/SignInPage.css";
import "./ProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, username, isModerator } = useAppSelector((s) => s.user);
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const payload = token ? parseJwtPayload(token) : null;

  return (
    <div className="profile-page">
      <div className="profile-page__inner">
        <h1 className="profile-page__title">Личный кабинет</h1>
        <Alert variant="info" className="profile-page__alert">
          Смена пароля и редактирование профиля пока недоступны. Ниже отображаются данные
          текущей сессии из JWT и Redux.
        </Alert>
        <Form className="profile-page__form">
          <Form.Group className="mb-3">
            <Form.Label>Логин</Form.Label>
            <Form.Control type="text" value={username} readOnly />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Роль</Form.Label>
            <Form.Control type="text" value={isModerator ? "Модератор" : "Пользователь"} readOnly />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Фрагмент JWT (для копирования в Postman / Insomnia)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              readOnly
              value={token ? `${token.slice(0, 48)}…` : ""}
              className="profile-page__jwt-preview"
            />
            <Form.Text className="text-muted">
              Полный токен: вкладка Application → Local Storage → ключ token. Заголовок:{" "}
              <code>Authorization: Bearer …</code>
            </Form.Text>
          </Form.Group>
          {payload ? (
            <Form.Group className="mb-3">
              <Form.Label>Распарсенные claims (иллюстрация)</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                readOnly
                value={JSON.stringify(payload, null, 2)}
              />
            </Form.Group>
          ) : null}
        </Form>
      </div>
    </div>
  );
}
