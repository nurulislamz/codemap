import { fireEvent, render, screen, within } from "@testing-library/react";
import type { MouseEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AppShell } from "./app-shell";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: {
    href: string;
    children: ReactNode;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/leetcode",
}));

describe("AppShell", () => {
  it("closes the LeetCode menu when clicking outside it", () => {
    render(
      <AuthProvider>
        <AppShell>Page content</AppShell>
      </AuthProvider>,
    );

    const nav = within(screen.getByRole("navigation", { name: "Primary navigation" }));

    expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.queryByRole("menu", { name: "LeetCode menu" })).not.toBeInTheDocument();

    fireEvent.mouseEnter(nav.getByRole("link", { name: "LeetCode" }));

    expect(screen.getByRole("menu", { name: "LeetCode menu" })).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByText("Page content"));

    expect(screen.queryByRole("menu", { name: "LeetCode menu" })).not.toBeInTheDocument();
  });

  it("closes the LeetCode menu from keyboard and menu item selection", () => {
    render(
      <AuthProvider>
        <AppShell>Page content</AppShell>
      </AuthProvider>,
    );

    const nav = within(screen.getByRole("navigation", { name: "Primary navigation" }));
    const leetcodeLink = nav.getByRole("link", { name: "LeetCode" });

    fireEvent.mouseEnter(leetcodeLink);
    expect(screen.getByRole("menu", { name: "LeetCode menu" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "LeetCode menu" })).not.toBeInTheDocument();

    fireEvent.mouseEnter(leetcodeLink);
    fireEvent.click(screen.getByRole("menuitem", { name: "Stats" }));
    expect(screen.queryByRole("menu", { name: "LeetCode menu" })).not.toBeInTheDocument();
  });
});
