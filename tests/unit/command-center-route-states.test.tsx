import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import CommandCenterError from "@/app/command-center/error";
import CommandCenterLoading from "@/app/command-center/loading";

describe("Command Center route states", () => {
  it("renders a safe loading skeleton for command center data", () => {
    render(<CommandCenterLoading />);

    expect(
      screen.getByRole("status", { name: "Đang tải Trung Tâm Điều Hành" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Đang tải dashboard và lịch sử trong phạm vi hiện tại.")).toBeInTheDocument();
  });

  it("renders a safe error state with retry and command-center return", () => {
    const reset = vi.fn();

    render(<CommandCenterError error={new Error("RAW_STACK_SENTINEL")} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "Không thể tải Trung Tâm Điều Hành" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("RAW_STACK_SENTINEL")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về Trung Tâm Điều Hành" })).toHaveAttribute(
      "href",
      "/command-center",
    );

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
