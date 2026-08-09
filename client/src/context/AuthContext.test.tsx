import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "@/context/auth";
import { PROFILE } from "@/test/fixtures";

const apiMock = vi.hoisted(() => ({
  refresh: vi.fn(),
  getMe: vi.fn(),
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/api", () => apiMock);

function Probe() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.email ?? "none"}</span>
      <button onClick={() => login("admin@velkor.local", "Admin123!")}>
        login
      </button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

async function renderProbe() {
  const utils = render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await waitFor(() =>
    expect(utils.getByTestId("loading").textContent).toBe("false"),
  );
  return utils;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the profile when a refresh token is valid", async () => {
    apiMock.refresh.mockResolvedValue(true);
    apiMock.getMe.mockResolvedValue(PROFILE);
    const utils = await renderProbe();
    expect(utils.getByTestId("user").textContent).toBe(PROFILE.email);
    expect(apiMock.refresh).toHaveBeenCalled();
    expect(apiMock.getMe).toHaveBeenCalled();
  });

  it("stays logged out when there is no refresh token", async () => {
    apiMock.refresh.mockResolvedValue(false);
    const utils = await renderProbe();
    expect(utils.getByTestId("user").textContent).toBe("none");
    expect(apiMock.getMe).not.toHaveBeenCalled();
  });

  it("stays logged out when refresh fails", async () => {
    apiMock.refresh.mockRejectedValue(new Error("boom"));
    const utils = await renderProbe();
    expect(utils.getByTestId("user").textContent).toBe("none");
  });

  it("logs in and stores the profile", async () => {
    apiMock.refresh.mockResolvedValue(false);
    apiMock.getMe.mockResolvedValue(PROFILE);
    const utils = await renderProbe();
    await userEvent.click(screen.getByText("login"));
    await waitFor(() =>
      expect(utils.getByTestId("user").textContent).toBe(PROFILE.email),
    );
    expect(apiMock.login).toHaveBeenCalledWith(
      "admin@velkor.local",
      "Admin123!",
    );
  });

  it("logs out and clears the profile", async () => {
    apiMock.refresh.mockResolvedValue(true);
    apiMock.getMe.mockResolvedValue(PROFILE);
    const utils = await renderProbe();
    await userEvent.click(screen.getByText("logout"));
    expect(apiMock.logout).toHaveBeenCalled();
    expect(utils.getByTestId("user").textContent).toBe("none");
  });
});
