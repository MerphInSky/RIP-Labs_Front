/**
 * Swagger-codegen-style клиент (axios) для доменов «заявка» (heatings)
 * и связи «заявка–стратегия» (heating_components).
 * Услуги (strategies) и users — не включены: для них используется отдельный axios в модулях.
 */

export interface WebBackendInternalAppSerializerComponentJSON {
  component_id?: number;
  is_deleted?: boolean;
  title?: string;
  description?: string;
  photo_url?: string;
  video?: string;
  thermal_resistance?: number;
  short_description_en?: string;
}

export interface WebBackendInternalAppSerializerHeatingJSON {
  heating_id?: number;
  status?: string;
  created_at?: string;
  creator_login?: string;
  moderator_login?: string | null;
  forming_date?: string | null;
  finish_date?: string | null;
  title?: string | null;
  incomplete_items_count?: number;
  ambient_temperature?: number;
}

export interface WebBackendInternalAppSerializerHeatingComponentJSON {
  heating_id?: number;
  component_id?: number;
  power_dissipation?: number;
  heat?: number | null;
}

export interface WebBackendInternalAppSerializerHeatingComponentDetailJSON {
  heating_id?: number;
  component_id?: number;
  power_dissipation?: number;
  heat?: number | null;
  component: WebBackendInternalAppSerializerComponentJSON;
}

export interface WebBackendInternalAppSerializerStatusJSON {
  status?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, unknown>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  secure?: boolean;
  path: string;
  type?: ContentType;
  query?: QueryParamsType;
  format?: ResponseType;
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export const ContentType = {
  Json: "application/json",
  JsonApi: "application/vnd.api+json",
  FormData: "multipart/form-data",
  UrlEncoded: "application/x-www-form-urlencoded",
  Text: "text/plain",
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "//localhost:8080/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    }
    return `${formItem}`;
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: unknown[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = unknown, _E = unknown>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    let reqBody: unknown = body;
    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      reqBody = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      reqBody = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: reqBody,
      url: path,
    });
  };
}

export class Api<SecurityDataType extends unknown = unknown> extends HttpClient<SecurityDataType> {
  /** Связь стратегии с заявкой (многие-ко-многим через таблицу нагрузки) */
  heatingComponentBinding = {
    addComponentToHeatingDraft: (componentId: number, params: RequestParams = {}) =>
      this.request<WebBackendInternalAppSerializerHeatingJSON, Record<string, string>>({
        path: `/heating_components/add/${componentId}`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    updateHeatingComponentLine: (
      componentId: number,
      heatingId: number,
      data: WebBackendInternalAppSerializerHeatingComponentJSON,
      params: RequestParams = {},
    ) =>
      this.request<
        WebBackendInternalAppSerializerHeatingComponentJSON,
        Record<string, string>
      >({
        path: `/heating_components/${componentId}/${heatingId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    deleteHeatingComponentLine: (
      componentId: number,
      heatingId: number,
      params: RequestParams = {},
    ) =>
      this.request<WebBackendInternalAppSerializerHeatingJSON, Record<string, string>>({
        path: `/heating_components/${componentId}/${heatingId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),
  };

  /** Заявка на системную нагрузку (heatings) */
  heatingApplication = {
    heatingApplicationCartList: (params: RequestParams = {}) =>
      this.request<Record<string, unknown>, Record<string, string>>({
        path: `/heatings/cart`,
        method: "GET",
        format: "json",
        ...params,
      }),

    allHeatingApplicationsList: (
      query?: {
        "from-date"?: string;
        "to-date"?: string;
        status?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<WebBackendInternalAppSerializerHeatingJSON[], Record<string, string>>({
        path: `/heatings`,
        method: "GET",
        query,
        secure: true,
        format: "json",
        ...params,
      }),

    heatingApplicationDetail: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, unknown>, Record<string, string>>({
        path: `/heatings/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    editHeatingApplicationUpdate: (
      id: number,
      body: WebBackendInternalAppSerializerHeatingJSON,
      params: RequestParams = {},
    ) =>
      this.request<WebBackendInternalAppSerializerHeatingJSON, Record<string, string>>({
        path: `/heatings/${id}`,
        method: "PUT",
        body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    deleteHeatingApplicationDelete: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/heatings/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    formHeatingApplicationUpdate: (id: number, params: RequestParams = {}) =>
      this.request<WebBackendInternalAppSerializerHeatingJSON, Record<string, string>>({
        path: `/heatings/${id}/form`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    finishHeatingApplicationUpdate: (
      id: number,
      status: WebBackendInternalAppSerializerStatusJSON,
      params: RequestParams = {},
    ) =>
      this.request<WebBackendInternalAppSerializerHeatingJSON, Record<string, string>>({
        path: `/heatings/${id}/finish`,
        method: "PUT",
        body: status,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
