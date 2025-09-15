import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import RuleBuilder, { RuleGroup } from "../components/RuleBuilder/RuleBuilder";

// Mock dependencies
vi.mock("react-beautiful-dnd", () => ({
  DragDropContext: ({ children }: any) => (
    <div data-testid="drag-drop-context">{children}</div>
  ),
  Droppable: ({ children }: any) =>
    children({ droppableProps: {}, innerRef: vi.fn() }, {}),
  Draggable: ({ children }: any) =>
    children(
      { draggableProps: {}, dragHandleProps: {}, innerRef: vi.fn() },
      {}
    ),
}));

vi.mock("@heroicons/react/24/outline", () => ({
  PlusIcon: () => <div data-testid="plus-icon" />,
  XMarkIcon: () => <div data-testid="x-mark-icon" />,
  ChevronDownIcon: () => <div data-testid="chevron-down-icon" />,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("RuleBuilder Component", () => {
  const mockOnChange = vi.fn();
  const mockOnPreview = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnPreview.mockClear();
  });

  it("renders with initial empty state", () => {
    renderWithProviders(<RuleBuilder onChange={mockOnChange} />);

    expect(screen.getByText("Segment Rules")).toBeInTheDocument();
    expect(screen.getByText("Add Rule")).toBeInTheDocument();
    expect(screen.getByText("Add Group")).toBeInTheDocument();
  });

  it("shows preview button when onPreview is provided", () => {
    renderWithProviders(
      <RuleBuilder
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        customerCount={150}
      />
    );

    expect(screen.getByText(/Preview \(150 customers\)/)).toBeInTheDocument();
  });

  it("calls onPreview when preview button is clicked", async () => {
    renderWithProviders(
      <RuleBuilder
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        customerCount={150}
      />
    );

    const previewButton = screen.getByText(/Preview/);
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalledTimes(1);
    });
  });

  it("adds a new rule when Add Rule button is clicked", () => {
    renderWithProviders(<RuleBuilder onChange={mockOnChange} />);

    const addRuleButton = screen.getByText("Add Rule");
    fireEvent.click(addRuleButton);

    // Should call onChange with a new rule added
    expect(mockOnChange).toHaveBeenCalled();
    const calledWith = mockOnChange.mock.calls[0][0] as RuleGroup;
    expect(calledWith.rules).toHaveLength(1);
  });

  it("shows loading state when isLoading is true", () => {
    renderWithProviders(
      <RuleBuilder
        onChange={mockOnChange}
        onPreview={mockOnPreview}
        isLoading={true}
      />
    );

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("displays query preview", () => {
    const initialRules: RuleGroup = {
      id: "root",
      logic: "AND",
      rules: [
        {
          id: "rule1",
          field: "firstName",
          operator: "equals",
          value: "John",
          type: "string",
        },
      ],
    };

    renderWithProviders(
      <RuleBuilder initialRules={initialRules} onChange={mockOnChange} />
    );

    expect(screen.getByText("Generated Query Preview")).toBeInTheDocument();
  });

  it("renders with initial rules", () => {
    const initialRules: RuleGroup = {
      id: "root",
      logic: "AND",
      rules: [
        {
          id: "rule1",
          field: "firstName",
          operator: "equals",
          value: "John",
          type: "string",
        },
      ],
    };

    renderWithProviders(
      <RuleBuilder initialRules={initialRules} onChange={mockOnChange} />
    );

    // Should display the initial rule
    expect(screen.getByDisplayValue("John")).toBeInTheDocument();
  });
});
