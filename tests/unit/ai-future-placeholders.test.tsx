import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import {
  AiFutureFeaturePlaceholders,
  EXECUTIVE_AI_FUTURE_FEATURES,
} from "@/modules/ai/components/ai-future-feature-placeholders";

describe("Executive AI future placeholders", () => {
  it("renders advanced AI features as unavailable future enhancements", () => {
    render(<AiFutureFeaturePlaceholders />);

    expect(EXECUTIVE_AI_FUTURE_FEATURES.map((feature) => feature.title)).toEqual(
      [
        "AI Risk Analysis",
        "AI KPI Analysis",
        "AI Executive Copilot",
        "AI Project Prediction",
      ],
    );

    for (const feature of EXECUTIVE_AI_FUTURE_FEATURES) {
      expect(screen.getByText(feature.title)).toBeInTheDocument();
      expect(screen.getByText(feature.statusLabel)).toBeInTheDocument();
    }

    expect(
      screen.getAllByText(/Chua trien khai trong MVP|Future enhancement/),
    ).toHaveLength(4);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
