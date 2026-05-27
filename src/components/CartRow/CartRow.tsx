import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchHeatingApplicationCart } from "../../store/slices/heatingApplicationSlice";
import { subscribeHeatingCart } from "../../modules/mock";
import cartIcon from "../../assets/logo.png";
import "./CartRow.css";

export default function CartRow({ className = "" }: { className?: string }) {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.heatingApplication.cart);

  useEffect(() => {
    const sync = () => {
      void dispatch(fetchHeatingApplicationCart());
    };
    sync();
    const unsubscribe = subscribeHeatingCart(sync);
    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const count = cart?.components_count ?? 0;
  const hasDraft = Boolean(cart?.has_draft && count > 0 && cart?.id != null);

  const inner = (
    <>
      <img src={cartIcon} alt="" className="cart-row__icon" aria-hidden />
      <span className="cart-row__text">{count}</span>
    </>
  );

  const rootClass = ["cart-row", className].filter(Boolean).join(" ");

  if (hasDraft && cart?.id != null) {
    return (
      <div className={rootClass}>
        <Link to={`/heating/${cart.id}`} className="cart-row__link">
          {inner}
        </Link>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div className="cart-row__inactive">{inner}</div>
    </div>
  );
}
