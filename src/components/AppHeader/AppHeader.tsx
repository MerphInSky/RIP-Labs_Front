import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutUser } from "../../store/slices/userSlice";
import { ROUTES } from "../../routePaths";
import "./AppHeader.css";
import cartIcon from "../../assets/logo.png";

export default function AppHeader() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, username } = useAppSelector((s) => s.user);
  const cart = useAppSelector((s) => s.heatingApplication.cart);

  const handleLogout = () => {
    void dispatch(logoutUser());
  };

  const draftActive =
    Boolean(cart?.has_draft && cart.components_count > 0 && cart.id != null);

  return (
    <header>
      <Navbar
        expand="lg"
        collapseOnSelect
        variant="dark"
        className="component-navbar py-0"
        data-bs-theme="dark"
      >
        <Container fluid className="component-navbar__inner">
          <Navbar.Brand as={Link} to="/" className="header-home mb-0 py-2">
            <img 
              src={cartIcon} 
              alt="Logo" 
              className="header-home__icon"
              style={{ height: '30px', width: 'auto' }}
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="component-main-nav" className="component-navbar__toggle" />
          <Navbar.Collapse id="component-main-nav">
            <Nav className="ms-auto mb-2 mb-lg-0 component-navbar__nav" navbar>
              <Nav.Link as={Link} to="/" className="component-nav-link" eventKey="catalog">
                Каталог компонентов
              </Nav.Link>
              {isAuthenticated ? (
                <>
                  <Nav.Link
                    as={Link}
                    to={ROUTES.HEATINGS}
                    className="component-nav-link"
                    eventKey="loads"
                  >
                    Заявки
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to={ROUTES.PROFILE}
                    className="component-nav-link"
                    eventKey="profile"
                  >
                    Личный кабинет
                  </Nav.Link>
                </>
              ) : null}
              {draftActive && cart?.id != null ? (
                <Nav.Link
                  as={Link}
                  to={`/heating/${cart.id}`}
                  className="component-nav-link"
                  eventKey="draft"
                >
                  Текущая заявка
                </Nav.Link>
              ) : (
                <Nav.Link className="component-nav-link component-nav-link--muted" eventKey="draft-off" disabled>
                  Текущая заявка
                </Nav.Link>
              )}
              {isAuthenticated ? (
                <>
                  <Nav.Link
                    as={Link}
                    to="/"
                    className="component-nav-link"
                    eventKey="logout"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    Выход
                  </Nav.Link>
                  <span className="component-navbar__username d-none d-lg-inline">{username}</span>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to={ROUTES.SIGN_IN} className="component-nav-link" eventKey="signin">
                    Вход
                  </Nav.Link>
                  <Nav.Link as={Link} to={ROUTES.SIGN_UP} className="component-nav-link" eventKey="signup">
                    Регистрация
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}
