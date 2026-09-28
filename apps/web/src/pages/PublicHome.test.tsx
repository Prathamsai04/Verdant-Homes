import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicHome } from "./PublicHome";
import { demoSite } from "../api/demo";

describe("public home", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => demoSite,
    }));
  });

  it("renders API house content and starts an enquiry", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <BrowserRouter><PublicHome /></BrowserRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("heading", { name: /calmer way to live/i })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /enquire for this room/i })[0]!);
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("open"));
    expect(screen.getByRole("heading", { name: /start with the room/i })).toBeInTheDocument();
  });
});
