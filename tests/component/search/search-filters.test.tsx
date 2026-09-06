import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

interface SearchFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

interface FilterState {
  query: string;
  minPrice: number | null;
  maxPrice: number | null;
  propertyTypes: string[];
  minBedrooms: number | null;
  maxBedrooms: number | null;
  minBathrooms: number | null;
  maxBathrooms: number | null;
  minSquareFeet: number | null;
  maxSquareFeet: number | null;
  city: string;
  state: string;
}

function SearchFilters({ onFilterChange, initialFilters }: SearchFiltersProps) {
  const [filters, setFilters] = React.useState<FilterState>({
    query: initialFilters?.query || "",
    minPrice: initialFilters?.minPrice || null,
    maxPrice: initialFilters?.maxPrice || null,
    propertyTypes: initialFilters?.propertyTypes || [],
    minBedrooms: initialFilters?.minBedrooms || null,
    maxBedrooms: initialFilters?.maxBedrooms || null,
    minBathrooms: initialFilters?.minBathrooms || null,
    maxBathrooms: initialFilters?.maxBathrooms || null,
    minSquareFeet: initialFilters?.minSquareFeet || null,
    maxSquareFeet: initialFilters?.maxSquareFeet || null,
    city: initialFilters?.city || "",
    state: initialFilters?.state || "",
  });

  const handleChange = (field: keyof FilterState, value: unknown) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTypeToggle = (type: string) => {
    const types = filters.propertyTypes.includes(type)
      ? filters.propertyTypes.filter((t) => t !== type)
      : [...filters.propertyTypes, type];
    handleChange("propertyTypes", types);
  };

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      query: "",
      minPrice: null,
      maxPrice: null,
      propertyTypes: [],
      minBedrooms: null,
      maxBedrooms: null,
      minBathrooms: null,
      maxBathrooms: null,
      minSquareFeet: null,
      maxSquareFeet: null,
      city: "",
      state: "",
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const propertyTypeOptions = ["house", "condo", "apartment", "townhouse", "land"];
  const bedroomOptions = [1, 2, 3, 4, 5];

  return (
    <div data-testid="search-filters" className="space-y-4">
      <div>
        <label htmlFor="search-query" className="block text-sm font-medium text-gray-700">
          Search
        </label>
        <input
          id="search-query"
          type="text"
          value={filters.query}
          onChange={(e) => handleChange("query", e.target.value)}
          placeholder="Search properties..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          data-testid="search-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Property Type</label>
        <div className="mt-2 flex flex-wrap gap-2" data-testid="property-type-filters">
          {propertyTypeOptions.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeToggle(type)}
              className={`rounded-full px-3 py-1 text-sm ${
                filters.propertyTypes.includes(type)
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              data-testid={`type-${type}`}
              aria-pressed={filters.propertyTypes.includes(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Price Range</label>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            value={filters.minPrice || ""}
            onChange={(e) =>
              handleChange("minPrice", e.target.value ? Number(e.target.value) : null)
            }
            placeholder="Min"
            className="block w-1/2 rounded-md border-gray-300 shadow-sm"
            data-testid="min-price"
          />
          <input
            type="number"
            value={filters.maxPrice || ""}
            onChange={(e) =>
              handleChange("maxPrice", e.target.value ? Number(e.target.value) : null)
            }
            placeholder="Max"
            className="block w-1/2 rounded-md border-gray-300 shadow-sm"
            data-testid="max-price"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
        <div className="mt-2 flex gap-2" data-testid="bedroom-filters">
          {bedroomOptions.map((num) => (
            <button
              key={num}
              onClick={() => handleChange("minBedrooms", filters.minBedrooms === num ? null : num)}
              className={`rounded px-3 py-1 text-sm ${
                filters.minBedrooms === num
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              data-testid={`bedrooms-${num}`}
              aria-pressed={filters.minBedrooms === num}
            >
              {num}+
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={filters.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="City"
            className="block w-1/2 rounded-md border-gray-300 shadow-sm"
            data-testid="city-input"
          />
          <input
            type="text"
            value={filters.state}
            onChange={(e) => handleChange("state", e.target.value)}
            placeholder="State"
            className="block w-1/2 rounded-md border-gray-300 shadow-sm"
            data-testid="state-input"
          />
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        data-testid="clear-filters"
      >
        Clear All Filters
      </button>
    </div>
  );
}

describe("SearchFilters", () => {
  it("renders all filter sections", () => {
    render(<SearchFilters onFilterChange={jest.fn()} />);

    expect(screen.getByTestId("search-input")).toBeDefined();
    expect(screen.getByTestId("property-type-filters")).toBeDefined();
    expect(screen.getByTestId("min-price")).toBeDefined();
    expect(screen.getByTestId("max-price")).toBeDefined();
    expect(screen.getByTestId("bedroom-filters")).toBeDefined();
    expect(screen.getByTestId("city-input")).toBeDefined();
    expect(screen.getByTestId("state-input")).toBeDefined();
    expect(screen.getByTestId("clear-filters")).toBeDefined();
  });

  it("calls onFilterChange when search input changes", () => {
    const onFilterChange = jest.fn();
    render(<SearchFilters onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "house in Austin" },
    });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ query: "house in Austin" })
    );
  });

  it("toggles property type filter", () => {
    const onFilterChange = jest.fn();
    render(<SearchFilters onFilterChange={onFilterChange} />);

    fireEvent.click(screen.getByTestId("type-house"));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ propertyTypes: ["house"] })
    );
  });

  it("removes property type when clicked again", () => {
    const onFilterChange = jest.fn();
    render(
      <SearchFilters
        onFilterChange={onFilterChange}
        initialFilters={{ propertyTypes: ["house"] }}
      />
    );

    fireEvent.click(screen.getByTestId("type-house"));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ propertyTypes: [] })
    );
  });

  it("updates price range filters", () => {
    const onFilterChange = jest.fn();
    render(<SearchFilters onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByTestId("min-price"), {
      target: { value: "300000" },
    });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ minPrice: 300000 })
    );
  });

  it("sets bedroom filter", () => {
    const onFilterChange = jest.fn();
    render(<SearchFilters onFilterChange={onFilterChange} />);

    fireEvent.click(screen.getByTestId("bedrooms-3"));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ minBedrooms: 3 })
    );
  });

  it("updates location filters", () => {
    const onFilterChange = jest.fn();
    render(<SearchFilters onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByTestId("city-input"), {
      target: { value: "Austin" },
    });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ city: "Austin" })
    );
  });

  it("clears all filters", () => {
    const onFilterChange = jest.fn();
    render(
      <SearchFilters
        onFilterChange={onFilterChange}
        initialFilters={{
          query: "house",
          minPrice: 300000,
          propertyTypes: ["house"],
        }}
      />
    );

    fireEvent.click(screen.getByTestId("clear-filters"));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "",
        minPrice: null,
        propertyTypes: [],
      })
    );
  });

  it("initializes with provided filters", () => {
    render(
      <SearchFilters
        onFilterChange={jest.fn()}
        initialFilters={{
          query: "condo",
          minPrice: 200000,
          city: "Miami",
        }}
      />
    );

    expect(screen.getByTestId("search-input")).toHaveValue("condo");
    expect(screen.getByTestId("min-price")).toHaveValue(200000);
    expect(screen.getByTestId("city-input")).toHaveValue("Miami");
  });

  it("renders property type buttons with correct labels", () => {
    render(<SearchFilters onFilterChange={jest.fn()} />);

    expect(screen.getByText("House")).toBeDefined();
    expect(screen.getByText("Condo")).toBeDefined();
    expect(screen.getByText("Apartment")).toBeDefined();
    expect(screen.getByText("Townhouse")).toBeDefined();
    expect(screen.getByText("Land")).toBeDefined();
  });

  it("renders bedroom buttons with correct labels", () => {
    render(<SearchFilters onFilterChange={jest.fn()} />);

    expect(screen.getByText("1+")).toBeDefined();
    expect(screen.getByText("2+")).toBeDefined();
    expect(screen.getByText("3+")).toBeDefined();
    expect(screen.getByText("4+")).toBeDefined();
    expect(screen.getByText("5+")).toBeDefined();
  });

  it("supports multiple property types", () => {
    const onFilterChange = jest.fn();
    render(<SearchFilters onFilterChange={onFilterChange} />);

    fireEvent.click(screen.getByTestId("type-house"));
    fireEvent.click(screen.getByTestId("type-condo"));

    expect(onFilterChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ propertyTypes: ["house", "condo"] })
    );
  });
});
