import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ComponentsPage from "./pages/ComponentsPage/ComponentsPage";
import ComponentPage from "./pages/ComponentPage/ComponentPage";
import HeatingPage from "./pages/HeatingPage/HeatingPage";
import HeatingsPage from "./pages/HeatingsPage/HeatingsPage";
import SignInPage from "./pages/SignInPage/SignInPage";
import SignUpPage from "./pages/SignUpPage/SignUpPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import { ROUTES } from "./routePaths";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index_style.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.COMPONENTS} element={<ComponentsPage />} />
          <Route path="/components" element={<Navigate to="/" replace />} />
          <Route path={ROUTES.COMPONENT} element={<ComponentPage />} />
          <Route path={ROUTES.HEATING} element={<HeatingPage />} />
          <Route path={ROUTES.HEATINGS} element={<HeatingsPage />} />
          <Route path={ROUTES.SIGN_IN} element={<SignInPage />} />
          <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
