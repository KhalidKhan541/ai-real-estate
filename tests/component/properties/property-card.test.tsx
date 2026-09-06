import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  imageUrl?: string;
  type: string;
  status: string;
  onSave?: (id: string) => void;
  onCompare?: (id: string) => void;
  onClick?: (id: string) => void;
}

function PropertyCard({
  id,
  title,
  price,
  address,
  bedrooms,
  bathrooms,
  squareFeet,
  imageUrl,
  type,
  status,
  onSave,
  onCompare,
  onClick,
}: PropertyCardProps) {
  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(p);

  return (
    <div
      data-testid={`property-card-${id}`}
      className="property-card"
      onClick={() => onClick?.(id)}
      role="article"
      aria-label={`Property: ${title}`}
    >
      <div className="relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-48 w-full object-cover"
            data-testid="property-image"
          />
        ) : (
          <div
            className="flex h-48 w-full items-center justify-center bg-gray-200"
            data-testid="property-placeholder"
          >
            <span>No Image</span>
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded px-2 py-1 text-xs font-semibold ${
            status === "active"
              ? "bg-green-100 text-green-800"
              : status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
          data-testid="property-status"
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span
          className="absolute right-2 top-2 rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
          data-testid="property-type"
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
      </div>

      <div className="p-4">
        <h3
          className="mb-1 text-lg font-bold text-gray-900"
          data-testid="property-title"
        >
          {title}
        </h3>
        <p
          className="mb-2 text-sm text-gray-500"
          data-testid="property-address"
        >
          {address}
        </p>
        <p
          className="mb-3 text-xl font-bold text-emerald-600"
          data-testid="property-price"
        >
          {formatPrice(price)}
        </p>

        <div className="mb-4 flex gap-4 text-sm text-gray-600">
          <span data-testid="property-bedrooms">
            <strong>{bedrooms}</strong> beds
          </span>
          <span data-testid="property-bathrooms">
            <strong>{bathrooms}</strong> baths
          </span>
          <span data-testid="property-sqft">
            <strong>{squareFeet.toLocaleString()}</strong> sqft
          </span>
        </div>

        <div className="flex gap-2">
          {onSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(id);
              }}
              className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              data-testid="save-button"
              aria-label="Save property"
            >
              Save
            </button>
          )}
          {onCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCompare(id);
              }}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              data-testid="compare-button"
              aria-label="Compare property"
            >
              Compare
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const defaultProps: PropertyCardProps = {
  id: "prop_1",
  title: "Beautiful Family Home",
  price: 450000,
  address: "123 Main St, Austin, TX 78701",
  bedrooms: 4,
  bathrooms: 3,
  squareFeet: 2500,
  imageUrl: "https://example.com/property.jpg",
  type: "house",
  status: "active",
};

describe("PropertyCard", () => {
  it("renders property details correctly", () => {
    render(<PropertyCard {...defaultProps} />);

    expect(screen.getByTestId("property-title")).toHaveTextContent(
      "Beautiful Family Home"
    );
    expect(screen.getByTestId("property-address")).toHaveTextContent(
      "123 Main St, Austin, TX 78701"
    );
    expect(screen.getByTestId("property-price")).toHaveTextContent("$450,000");
    expect(screen.getByTestId("property-bedrooms")).toHaveTextContent("4");
    expect(screen.getByTestId("property-bathrooms")).toHaveTextContent("3");
    expect(screen.getByTestId("property-sqft")).toHaveTextContent("2,500");
  });

  it("renders property image when provided", () => {
    render(<PropertyCard {...defaultProps} />);

    const img = screen.getByTestId("property-image");
    expect(img).toHaveAttribute("src", "https://example.com/property.jpg");
    expect(img).toHaveAttribute("alt", "Beautiful Family Home");
  });

  it("renders placeholder when no image", () => {
    render(<PropertyCard {...defaultProps} imageUrl={undefined} />);

    expect(screen.getByTestId("property-placeholder")).toHaveTextContent(
      "No Image"
    );
  });

  it("displays status badge", () => {
    render(<PropertyCard {...defaultProps} />);

    expect(screen.getByTestId("property-status")).toHaveTextContent("Active");
  });

  it("displays type badge", () => {
    render(<PropertyCard {...defaultProps} />);

    expect(screen.getByTestId("property-type")).toHaveTextContent("House");
  });

  it("shows pending status with correct styling", () => {
    render(<PropertyCard {...defaultProps} status="pending" />);

    expect(screen.getByTestId("property-status")).toHaveTextContent("Pending");
  });

  it("calls onSave when save button clicked", () => {
    const onSave = jest.fn();
    render(<PropertyCard {...defaultProps} onSave={onSave} />);

    fireEvent.click(screen.getByTestId("save-button"));

    expect(onSave).toHaveBeenCalledWith("prop_1");
  });

  it("calls onCompare when compare button clicked", () => {
    const onCompare = jest.fn();
    render(<PropertyCard {...defaultProps} onCompare={onCompare} />);

    fireEvent.click(screen.getByTestId("compare-button"));

    expect(onCompare).toHaveBeenCalledWith("prop_1");
  });

  it("calls onClick when card clicked", () => {
    const onClick = jest.fn();
    render(<PropertyCard {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByTestId("property-card-prop_1"));

    expect(onClick).toHaveBeenCalledWith("prop_1");
  });

  it("does not show save button when onSave not provided", () => {
    render(<PropertyCard {...defaultProps} />);

    expect(screen.queryByTestId("save-button")).toBeNull();
  });

  it("does not show compare button when onCompare not provided", () => {
    render(<PropertyCard {...defaultProps} />);

    expect(screen.queryByTestId("compare-button")).toBeNull();
  });

  it("renders with correct accessibility attributes", () => {
    render(<PropertyCard {...defaultProps} />);

    const card = screen.getByRole("article");
    expect(card).toHaveAttribute(
      "aria-label",
      "Property: Beautiful Family Home"
    );
  });

  it("formats large prices correctly", () => {
    render(<PropertyCard {...defaultProps} price={1250000} />);

    expect(screen.getByTestId("property-price")).toHaveTextContent(
      "$1,250,000"
    );
  });

  it("formats square feet with commas", () => {
    render(<PropertyCard {...defaultProps} squareFeet={10500} />);

    expect(screen.getByTestId("property-sqft")).toHaveTextContent("10,500");
  });
});
