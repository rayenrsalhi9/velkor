import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { AuthContext, type AuthState } from "@/context/auth";
import { PROFILE } from "./fixtures";

export function authState(over: Partial<AuthState> = {}): AuthState {
  return {
    user: PROFILE,
    loading: false,
    login: async () => {},
    logout: () => {},
    setUser: () => {},
    ...over,
  };
}

export function renderWithAuth(
  ui: ReactElement,
  over: Partial<AuthState> = {},
) {
  return render(
    <AuthContext.Provider value={authState(over)}>{ui}</AuthContext.Provider>,
  );
}
