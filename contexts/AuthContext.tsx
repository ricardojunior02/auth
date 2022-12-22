import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../src/services/api";
import Router from "next/router";
import { destroyCookie, parseCookies, setCookie } from "nookies";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

type SignInCredential = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SignInCredential): Promise<void>;
  user: User | undefined;
  isAuthenticated: boolean;
};

export const AuthContext = createContext({} as AuthContextData);

type AuthProviderProps = {
  children: ReactNode;
};

export function signOut() {
  destroyCookie(undefined, "auth.token");
  destroyCookie(undefined, "auth.refreshToken");

  Router.push("/");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  useEffect(() => {
    const { "auth.token": token } = parseCookies();

    if (token) {
      api
        .get("/me")
        .then((res) =>
          setUser({
            email: res.data.email,
            permissions: res.data.permissions,
            roles: res.data.roles,
          })
        )
        .catch(() => {
          signOut();
        });
    }
  }, []);

  async function signIn({ email, password }: SignInCredential) {
    const response = await api.post("/sessions", {
      email,
      password,
    });

    const { token, refreshToken, permissions, roles } = response.data;

    setCookie(undefined, "auth.token", token, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    setCookie(undefined, "auth.refreshToken", refreshToken, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    setUser({
      email,
      permissions,
      roles,
    });

    api.defaults.headers["Authorization"] = `Bearer ${token}`;

    Router.push("/dashboard");
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
}
