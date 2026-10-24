// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Button,
  Card,
  Badge,
  PageHeader,
  SectionHeader,
  TextField,
  SelectField,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  ResponsiveDialog,
  ConfirmationDialog,
} from "@/components/bloom/index.js";
import { Btn, Card as LegacyCard, Chip } from "@/components/common/ui.jsx";
import { Sparkles, Heart, Droplet } from "lucide-react";

describe("Saheli 9.0 — Bloom Design System Primitives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Button Primitive", () => {
    it("renders primary button with accessible attributes and touch target", () => {
      render(
        <Button variant="primary" size="md">
          Save Record
        </Button>,
      );
      const btn = screen.getByRole("button", { name: /Save Record/i });
      expect(btn).toBeDefined();
      expect(btn.className).toContain("bg-primary");
      expect(btn.className).toContain("min-h-[46px]");
      expect(btn.className).toContain("tactile-press");
    });

    it("renders with left and right icons correctly", () => {
      render(
        <Button variant="secondary" leftIcon={Droplet} rightIcon={Sparkles}>
          Log Period
        </Button>,
      );
      const btn = screen.getByRole("button", { name: /Log Period/i });
      expect(btn).toBeDefined();
      expect(btn.className).toContain("bg-secondary");
    });

    it("displays loading spinner and disables button when isLoading is true", () => {
      render(
        <Button variant="primary" isLoading>
          Submitting
        </Button>,
      );
      const btn = screen.getByRole("button", { name: /Submitting/i });
      expect(btn.disabled).toBe(true);
      expect(btn.className).toContain("disabled:opacity-45");
    });

    it("supports all semantic variants (danger, outline, ghost, accent)", () => {
      const { rerender } = render(<Button variant="danger">Delete</Button>);
      expect(screen.getByRole("button").className).toContain("bg-destructive");

      rerender(<Button variant="outline">Cancel</Button>);
      expect(screen.getByRole("button").className).toContain("border-border");

      rerender(<Button variant="accent">Special</Button>);
      expect(screen.getByRole("button").className).toContain("bg-accent");
    });
  });

  describe("Card Primitive", () => {
    it("renders base bloom-card with proper surface and border classes", () => {
      render(
        <Card variant="default">
          <h2>Summary Card</h2>
        </Card>,
      );
      const card = screen.getByText("Summary Card").closest("section");
      expect(card).toBeDefined();
      expect(card.className).toContain("bloom-card");
    });

    it("renders elevated and glass variants", () => {
      const { container, rerender } = render(<Card variant="elevated">Elevated</Card>);
      expect(container.firstChild.className).toContain("bloom-card-elevated");

      rerender(<Card variant="glass">Frosted</Card>);
      expect(container.firstChild.className).toContain("bloom-glass");
    });
  });

  describe("Badge Primitive", () => {
    it("renders tone-specific accessible status pills", () => {
      const { rerender } = render(
        <Badge tone="success" icon={Sparkles}>
          Active Rhythm
        </Badge>,
      );
      const badge = screen.getByText("Active Rhythm").parentElement;
      expect(badge.className).toContain("text-emerald-700");

      rerender(<Badge tone="danger">Red Flag Alert</Badge>);
      expect(screen.getByText("Red Flag Alert").parentElement.className).toContain("text-rose-700");

      rerender(<Badge tone="warning">Irregular</Badge>);
      expect(screen.getByText("Irregular").parentElement.className).toContain("text-amber-800");
    });
  });

  describe("PageHeader & SectionHeader", () => {
    it("renders PageHeader with tag, fluid title, and subtitle", () => {
      render(
        <PageHeader
          tag="Menstrual Health"
          title="My Phase Tracker"
          subtitle="Real-time cycle phase calculations"
        />,
      );
      expect(screen.getByText("Menstrual Health")).toBeDefined();
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("My Phase Tracker");
      expect(screen.getByText("Real-time cycle phase calculations")).toBeDefined();
    });

    it("renders SectionHeader with count badge and action slot", () => {
      render(
        <SectionHeader
          title="Recorded Cycles"
          count={6}
          action={<button type="button">View All</button>}
        />,
      );
      expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Recorded Cycles");
      expect(screen.getByText("6")).toBeDefined();
      expect(screen.getByRole("button", { name: "View All" })).toBeDefined();
    });
  });

  describe("Form Fields (TextField, SelectField)", () => {
    it("renders TextField with label, hint, and error alert", () => {
      render(
        <TextField
          label="Cycle Length (Days)"
          hint="Standard cycle length between 21 and 35 days"
          error="Must be a valid positive number"
          defaultValue={28}
        />,
      );
      expect(screen.getByLabelText(/Cycle Length/i)).toBeDefined();
      expect(screen.getByText("Standard cycle length between 21 and 35 days")).toBeDefined();
      expect(screen.getByRole("alert").textContent).toBe("Must be a valid positive number");
    });

    it("renders SelectField with options", () => {
      const options = [
        { value: "en", label: "English" },
        { value: "hi", label: "Hindi" },
        { value: "ur", label: "Urdu" },
      ];
      render(<SelectField label="Select Language" options={options} defaultValue="hi" />);
      const select = screen.getByLabelText(/Select Language/i);
      expect(select.value).toBe("hi");
      expect(select.children.length).toBe(3);
    });
  });

  describe("States & Feedback (EmptyState, ErrorState, LoadingSkeleton)", () => {
    it("renders EmptyState with illustration and action button", () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No Logs Recorded"
          description="Log your daily symptoms to unlock personalized phase predictions."
          actionLabel="Log Today"
          onAction={handleAction}
        />,
      );
      expect(screen.getByText("No Logs Recorded")).toBeDefined();
      const btn = screen.getByRole("button", { name: "Log Today" });
      fireEvent.click(btn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it("renders ErrorState with role=alert and retry action", () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Unable to load insights"
          message="Storage read error occurred"
          onRetry={handleRetry}
        />,
      );
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText("Unable to load insights")).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it("renders LoadingSkeleton with pulse animation", () => {
      const { container } = render(<LoadingSkeleton count={3} />);
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(3);
    });
  });

  describe("Modals & Dialogs (ResponsiveDialog, ConfirmationDialog)", () => {
    it("renders ResponsiveDialog when isOpen is true and triggers onClose on escape", () => {
      const handleClose = vi.fn();
      render(
        <ResponsiveDialog isOpen={true} onClose={handleClose} title="Customize Widgets">
          <p>Dialog body content</p>
        </ResponsiveDialog>,
      );
      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Customize Widgets")).toBeDefined();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("renders ConfirmationDialog with danger confirm button", () => {
      const handleConfirm = vi.fn();
      const handleClose = vi.fn();
      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title="Delete All Diary Data"
          message="This action is irreversible and permanently deletes your local records."
          confirmLabel="Permanently Delete"
          isDanger={true}
        />,
      );
      expect(screen.getByText("Delete All Diary Data")).toBeDefined();
      const confirmBtn = screen.getByRole("button", { name: "Permanently Delete" });
      expect(confirmBtn.className).toContain("bg-destructive");
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe("Legacy ui.jsx backwards compatibility", () => {
    it("Btn re-exports with Saheli Bloom tokens and active state", () => {
      render(<Btn variant="primary">Legacy Button</Btn>);
      const btn = screen.getByRole("button", { name: "Legacy Button" });
      expect(btn.className).toContain("bg-primary");
      expect(btn.className).toContain("min-h-12");
    });

    it("Chip renders accessible selection checkmark and aria-pressed", () => {
      const handleClick = vi.fn();
      render(
        <Chip selected={true} onClick={handleClick} icon={Heart} label="Select Mood">
          Joyful
        </Chip>,
      );
      const chip = screen.getByRole("button", { name: /Select Mood/i });
      expect(chip.getAttribute("aria-pressed")).toBe("true");
      expect(chip.textContent).toContain("✓");
    });
  });
});
