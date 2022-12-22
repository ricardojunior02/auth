import axios, { AxiosError, AxiosResponse } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../../contexts/AuthContext";
const cookies = parseCookies();

export const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    authorization: `Bearer ${cookies["auth.token"]}`,
  },
});

let isRefreshing = false;
let failedRequestsQueue: object[] = [];

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (
        error.response.data?.code === "token.expired" ||
        error.response.data?.code === "token.invalid"
      ) {
        const cookies = parseCookies();
        const originalConfig = error.config;

        const { "auth.refreshToken": refreshToken } = cookies;

        if (!isRefreshing) {
          isRefreshing = true;

          api
            .post("/refresh", {
              refreshToken,
            })
            .then((res) => {
              const { token } = res.data;

              setCookie(undefined, "auth.token", token, {
                maxAge: 60 * 60 * 24 * 30,
                path: "/",
              });
              setCookie(undefined, "auth.refreshToken", res.data.refreshToken, {
                maxAge: 60 * 60 * 24 * 30,
                path: "/",
              });

              api.defaults.headers["authorization"] = `Bearer ${token}`;

              failedRequestsQueue.forEach((request) =>
                request.onSuccess(token)
              );
              failedRequestsQueue = [];
            })
            .catch((err) => {
              failedRequestsQueue.forEach((request) => request.onFailure(err));
              failedRequestsQueue = [];
            })
            .finally(() => {
              return (isRefreshing = false);
            });
        }

        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers["authorization"] = `Bearer ${token}`;
              resolve(api(originalConfig));
            },
            onFailure: (err: AxiosError) => {
              reject(err);
            },
          });
        });
      } else {
        signOut();
      }
    }

    return Promise.reject(error);
  }
);
