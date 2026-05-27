import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api";
import type {
  WebBackendInternalAppSerializerComponentJSON,
  WebBackendInternalAppSerializerHeatingJSON,
  WebBackendInternalAppSerializerHeatingComponentJSON,
} from "../../api/Api";
import type {
  ComponentJSON,
  HeatingDetailResponse,
  HeatingJSON,
} from "../../modules/componentsApi";
import { apiErrMessage } from "../utils/apiError";
import { logoutUser } from "./userSlice";

function mapComponent(
  s: WebBackendInternalAppSerializerComponentJSON,
): ComponentJSON {
  return {
    component_id: Number(s.component_id ?? 0),
    title: s.title ?? "",
    description: s.description ?? "",
    is_deleted: Boolean(s.is_deleted),
    photo_url: s.photo_url ?? "",
    video: s.video ?? "",
    thermal_resistance: Number(s.thermal_resistance ?? 0),
    short_description_en: s.short_description_en,
  };
}

function mapHeatingRow(sl: WebBackendInternalAppSerializerHeatingJSON): HeatingJSON {
  return {
    heating_id: Number(sl.heating_id ?? 0),
    status: sl.status ?? "",
    created_at: sl.created_at != null ? String(sl.created_at) : "",
    creator_login: sl.creator_login ?? "",
    moderator_login: sl.moderator_login,
    forming_date: sl.forming_date,
    finish_date: sl.finish_date,
    title: sl.title,
    incomplete_items_count: Number(sl.incomplete_items_count ?? 0),
    ambient_temperature: Number(sl.ambient_temperature ?? 0),
  };
}

function asDetail(data: unknown): HeatingDetailResponse | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const slRaw = o.heating;
  const componentsRaw = o.components;
  if (!slRaw || typeof slRaw !== "object" || !Array.isArray(componentsRaw)) return null;
  const sl = mapHeatingRow(slRaw as WebBackendInternalAppSerializerHeatingJSON);
  const components = componentsRaw.map((row) => {
    const r = row as Record<string, unknown>;
    const st = r.component as WebBackendInternalAppSerializerComponentJSON;
    return {
      heating_id: Number(r.heating_id ?? sl.heating_id),
      component_id: Number(r.component_id ?? 0),
      power_dissipation: Number(r.power_dissipation ?? 0),
      heat:
        r.heat === null || r.heat === undefined
          ? null
          : Number(r.heat),
      component: mapComponent(st ?? {}),
    };
  });
  return { heating: sl, components };
}

function defaultListFilters() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  const day = `${y}-${m}-${d}`;
  return { fromDate: day, toDate: day, status: "", creatorLogin: "" };
}

function buildInitialState() {
  return {
    cart: null as {
      has_draft: boolean;
     components_count: number;
      id?: number;
    } | null,
    cartLoading: false,
    detail: null as HeatingDetailResponse | null,
    detailLoading: false,
    detailError: null as string | null,
    list: [] as HeatingJSON[],
    listLoading: false,
    listError: null as string | null,
    filters: defaultListFilters(),
    itemMutationLoading: {} as Record<string, boolean>,
    applicationMutationLoading: false,
  };
}

type CartSliceUser = { user: { isAuthenticated: boolean } };

function emptyGuestCartPayload() {
  return {
    has_draft: false,
    components_count: 0,
    id: undefined as number | undefined,
  };
}

function axiosStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "response" in e) {
    const r = (e as { response?: { status?: number } }).response;
    return r?.status;
  }
  return undefined;
}

export const fetchHeatingApplicationCart = createAsyncThunk(
  "heatingApplication/fetchCart",
  async (_, { rejectWithValue, getState }) => {
    const before = getState() as CartSliceUser;
    if (!before.user.isAuthenticated) {
      return emptyGuestCartPayload();
    }
    try {
      const r = await api.heatingApplication.heatingApplicationCartList();
      const after = getState() as CartSliceUser;
      if (!after.user.isAuthenticated) {
        return emptyGuestCartPayload();
      }
      const d = r.data as Record<string, unknown>;
      return {
        has_draft: Boolean(d.has_draft),
        components_count: Number(d.components_count ?? 0),
        id: typeof d.id === "number" ? d.id : undefined,
      };
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const fetchHeatingApplicationDetail = createAsyncThunk(
  "heatingApplication/fetchDetail",
  async (applicationId: number, { rejectWithValue }) => {
    try {
      const r = await api.heatingApplication.heatingApplicationDetail(applicationId);
      const detail = asDetail(r.data);
      if (!detail) return rejectWithValue("Неверный ответ сервера");
      return detail;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const addComponentToHeatingApplication = createAsyncThunk(
  "heatingApplication/addComponentLine",
  async (componentId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.heatingComponentBinding.addComponentToHeatingDraft(componentId);
      await dispatch(fetchHeatingApplicationCart());
      return componentId;
    } catch (e) {
      if (axiosStatus(e) === 409) {
        await dispatch(fetchHeatingApplicationCart());
        return componentId;
      }
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const updateHeatingComponentLine = createAsyncThunk(
  "heatingApplication/updateComponentLine",
  async (
    {
      componentId,
      heatingId,
      body,
    }: {
      componentId: number;
      heatingId: number;
      body: WebBackendInternalAppSerializerHeatingComponentJSON;
    },
    { rejectWithValue, dispatch },
  ) => {
    const key = `${componentId}-${heatingId}`;
    try {
      await api.heatingComponentBinding.updateHeatingComponentLine(
        componentId,
        heatingId,
        body,
      );
      await dispatch(fetchHeatingApplicationDetail(heatingId));
      return key;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const removeHeatingComponentLine = createAsyncThunk(
  "heatingApplication/removeComponentLine",
  async (
    { componentId, heatingId }: { componentId: number; heatingId: number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.heatingComponentBinding.deleteHeatingComponentLine(componentId, heatingId);
      await dispatch(fetchHeatingApplicationDetail(heatingId));
      await dispatch(fetchHeatingApplicationCart());
      return componentId;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const updateHeatingApplicationDraft = createAsyncThunk(
  "heatingApplication/updateApplicationDraft",
  async (
    {
      applicationId,
      body,
    }: { applicationId: number; body: WebBackendInternalAppSerializerHeatingJSON },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.heatingApplication.editHeatingApplicationUpdate(applicationId, body);
      await dispatch(fetchHeatingApplicationDetail(applicationId));
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const formHeatingApplication = createAsyncThunk(
  "heatingApplication/form",
  async (applicationId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.heatingApplication.formHeatingApplicationUpdate(applicationId);
      await dispatch(fetchHeatingApplicationDetail(applicationId));
      await dispatch(fetchHeatingApplicationCart());
      await dispatch(fetchHeatingApplicationsList());
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const deleteHeatingApplication = createAsyncThunk(
  "heatingApplication/deleteApplication",
  async (applicationId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.heatingApplication.deleteHeatingApplicationDelete(applicationId);
      await dispatch(fetchHeatingApplicationCart());
      await dispatch(fetchHeatingApplicationsList());
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const finishHeatingApplication = createAsyncThunk(
  "heatingApplication/finish",
  async (
    { applicationId, status }: { applicationId: number; status: "completed" | "rejected" },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.heatingApplication.finishHeatingApplicationUpdate(applicationId, {
        status,
      });
      await dispatch(fetchHeatingApplicationsList());
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const fetchHeatingApplicationsList = createAsyncThunk(
  "heatingApplication/fetchList",
  async (_, { getState, rejectWithValue }) => {
    try {
      const st = getState() as {
        heatingApplication: { filters: ReturnType<typeof defaultListFilters> };
      };
      const f = st.heatingApplication.filters;
      const query: { "from-date"?: string; "to-date"?: string; status?: string } = {};
      if (f.fromDate) query["from-date"] = f.fromDate;
      if (f.toDate) query["to-date"] = f.toDate;
      if (f.status) query.status = f.status;
      const r = await api.heatingApplication.allHeatingApplicationsList(query);
      return (r.data ?? []).map(mapHeatingRow);
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

const heatingApplicationSlice = createSlice({
  name: "heatingApplication",
  initialState: buildInitialState(),
  reducers: {
    clearHeatingApplicationDetailError: (state) => {
      state.detailError = null;
    },
    setListFilters: (
      state,
      action: PayloadAction<Partial<ReturnType<typeof defaultListFilters>>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetListFiltersToToday: (state) => {
      state.filters = defaultListFilters();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutUser.fulfilled, () => buildInitialState())
      .addCase(logoutUser.rejected, () => buildInitialState())
      .addCase(fetchHeatingApplicationCart.pending, (state) => {
        state.cartLoading = true;
      })
      .addCase(fetchHeatingApplicationCart.fulfilled, (state, action) => {
        state.cartLoading = false;
        if (
          typeof action.payload === "object" &&
          action.payload &&
          "components_count" in action.payload
        ) {
          state.cart = action.payload as typeof state.cart;
        }
      })
      .addCase(fetchHeatingApplicationCart.rejected, (state) => {
        state.cartLoading = false;
        state.cart = {
          has_draft: false,
          components_count: 0,
        };
      })
      .addCase(fetchHeatingApplicationDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.detail = null;
      })
      .addCase(fetchHeatingApplicationDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchHeatingApplicationDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      .addCase(fetchHeatingApplicationsList.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchHeatingApplicationsList.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchHeatingApplicationsList.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      })
      .addCase(addComponentToHeatingApplication.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(addComponentToHeatingApplication.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(addComponentToHeatingApplication.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateHeatingApplicationDraft.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(updateHeatingApplicationDraft.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateHeatingApplicationDraft.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(formHeatingApplication.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(formHeatingApplication.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(formHeatingApplication.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(deleteHeatingApplication.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(deleteHeatingApplication.fulfilled, (state) => {
        state.applicationMutationLoading = false;
        state.detail = null;
      })
      .addCase(deleteHeatingApplication.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateHeatingComponentLine.pending, (state, action) => {
        const k = `${action.meta.arg.componentId}-${action.meta.arg.heatingId}`;
        state.itemMutationLoading[`line-${k}`] = true;
      })
      .addCase(updateHeatingComponentLine.fulfilled, (state, action) => {
        delete state.itemMutationLoading[`line-${action.payload}`];
      })
      .addCase(updateHeatingComponentLine.rejected, (state, action) => {
        const id = action.meta?.arg;
        if (id)
          delete state.itemMutationLoading[`line-${id.componentId}-${id.heatingId}`];
      })
      .addCase(removeHeatingComponentLine.pending, (state, action) => {
        const id = action.meta.arg.componentId;
        state.itemMutationLoading[`rm-${id}`] = true;
      })
      .addCase(removeHeatingComponentLine.fulfilled, (state, action) => {
        const id = action.payload;
        delete state.itemMutationLoading[`rm-${id}`];
      })
      .addCase(removeHeatingComponentLine.rejected, (state, action) => {
        const id = action.meta?.arg?.componentId;
        if (id != null) delete state.itemMutationLoading[`rm-${id}`];
      })
      .addCase(finishHeatingApplication.pending, (state, action) => {
        const id = action.meta.arg.applicationId;
        state.itemMutationLoading[`finish-${id}`] = true;
      })
      .addCase(finishHeatingApplication.fulfilled, (state, action) => {
        const id = action.meta.arg.applicationId;
        delete state.itemMutationLoading[`finish-${id}`];
      })
      .addCase(finishHeatingApplication.rejected, (state, action) => {
        const id = action.meta?.arg?.applicationId;
        if (id != null) delete state.itemMutationLoading[`finish-${id}`];
      });
  },
});

export const {
  clearHeatingApplicationDetailError,
  setListFilters,
  resetListFiltersToToday,
} = heatingApplicationSlice.actions;
export default heatingApplicationSlice.reducer;
