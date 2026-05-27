import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loginUser } from "../../store/slices/userSlice";
import { fetchHeatingApplicationCart } from "../../store/slices/heatingApplicationSlice";
import { ROUTES } from "../../routePaths";
import "./SignInPage.css";

export default function SignInPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector((s) => s.user);
  const [form, setForm] = useState({ login: "", password: "" });

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.COMPONENTS, { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.login || !form.password) return;
    try {
      await dispatch(loginUser(form)).unwrap();
      void dispatch(fetchHeatingApplicationCart());
      navigate(ROUTES.COMPONENTS, { replace: true });
    } catch {
      void 0;
    }
  };

  return (
    <div className="auth-page auth-page--component">
      <div className="auth-page__panel">
        <h1 className="auth-page__title">Вход в систему</h1>
        {error ? <div className="auth-page__error">{error}</div> : null}
        <form onSubmit={handleSubmit} className="auth-page__form">
          <label className="auth-page__label" htmlFor="signin-login">
            Логин
          </label>
          <input
            id="signin-login"
            className="auth-page__input"
            type="text"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            required
            disabled={loading}
            autoComplete="username"
          />
          <label className="auth-page__label" htmlFor="signin-password">
            Пароль
          </label>
          <input
            id="signin-password"
            className="auth-page__input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            disabled={loading}
            autoComplete="current-password"
          />
          <button type="submit" className="auth-page__submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="auth-page__spinner" /> Вход…
              </>
            ) : (
              "Войти"
            )}
          </button>
        </form>
        <p className="auth-page__footer">
          Нет аккаунта? <Link to={ROUTES.SIGN_UP}>Регистрация</Link>
        </p>
      </div>
    </div>
  );
}
