import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import heatingApplicationReducer from "./slices/heatingApplicationSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    heatingApplication: heatingApplicationReducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
