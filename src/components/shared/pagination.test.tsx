import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("should not render when totalPages <= 1", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("should render page info", () => {
    render(
      <Pagination page={2} totalPages={5} onPageChange={() => {}} />,
    );
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
  });

  it("should disable previous button on first page", () => {
    render(
      <Pagination page={1} totalPages={5} onPageChange={() => {}} />,
    );
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).not.toBeDisabled();
  });

  it("should disable next button on last page", () => {
    render(
      <Pagination page={5} totalPages={5} onPageChange={() => {}} />,
    );
    expect(screen.getByLabelText("Previous page")).not.toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("should call onPageChange when clicking next", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination page={2} totalPages={5} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("should call onPageChange when clicking previous", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination page={3} totalPages={5} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
