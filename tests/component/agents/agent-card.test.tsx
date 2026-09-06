import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

interface AgentCardProps {
  id: string;
  name: string;
  email: string;
  phone: string;
  brokerage: string;
  specializations: string[];
  rating: number;
  reviewCount: number;
  totalSales: number;
  experience: number;
  avatar?: string;
  isVerified: boolean;
  isPremium: boolean;
  availability: "available" | "busy" | "offline";
  onContact?: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

function AgentCard({
  id,
  name,
  email,
  phone,
  brokerage,
  specializations,
  rating,
  reviewCount,
  totalSales,
  experience,
  avatar,
  isVerified,
  isPremium,
  availability,
  onContact,
  onViewProfile,
}: AgentCardProps) {
  const availabilityColors = {
    available: "bg-green-100 text-green-800",
    busy: "bg-yellow-100 text-yellow-800",
    offline: "bg-gray-100 text-gray-800",
  };

  const renderStars = (r: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={i <= r ? "text-yellow-400" : "text-gray-300"}
          aria-hidden="true"
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div
      data-testid={`agent-card-${id}`}
      className="agent-card rounded-lg border p-4 shadow-sm"
      role="article"
      aria-label={`Agent: ${name}`}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-16 w-16 rounded-full object-cover"
              data-testid="agent-avatar"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
              data-testid="agent-avatar-placeholder"
            >
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          )}
          {isVerified && (
            <span
              className="absolute -bottom-1 -right-1 rounded-full bg-blue-500 p-0.5 text-white"
              data-testid="verified-badge"
              title="Verified Agent"
            >
              ✓
            </span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900" data-testid="agent-name">
              {name}
            </h3>
            {isPremium && (
              <span
                className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800"
                data-testid="premium-badge"
              >
                Premium
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500" data-testid="agent-brokerage">
            {brokerage}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <div data-testid="agent-rating" aria-label={`Rating: ${rating} out of 5`}>
              {renderStars(Math.round(rating))}
            </div>
            <span className="text-sm text-gray-600" data-testid="agent-review-count">
              ({reviewCount} reviews)
            </span>
          </div>

          <div className="mt-2 flex gap-4 text-sm text-gray-600">
            <span data-testid="agent-sales">
              <strong>{totalSales}</strong> sales
            </span>
            <span data-testid="agent-experience">
              <strong>{experience}</strong> years
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {specializations.map((spec) => (
              <span
                key={spec}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                data-testid="specialization-tag"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${availabilityColors[availability]}`}
            data-testid="agent-availability"
          >
            {availability.charAt(0).toUpperCase() + availability.slice(1)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t pt-4">
        {onContact && (
          <button
            onClick={() => onContact(id)}
            className="flex-1 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            data-testid="contact-button"
          >
            Contact Agent
          </button>
        )}
        {onViewProfile && (
          <button
            onClick={() => onViewProfile(id)}
            className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            data-testid="view-profile-button"
          >
            View Profile
          </button>
        )}
      </div>
    </div>
  );
}

const defaultProps: AgentCardProps = {
  id: "agt_1",
  name: "John Smith",
  email: "john@realty.com",
  phone: "(512) 555-1234",
  brokerage: "Austin Realty Group",
  specializations: ["luxury", "first-time-buyers"],
  rating: 4.8,
  reviewCount: 42,
  totalSales: 156,
  experience: 8,
  avatar: "https://example.com/avatar.jpg",
  isVerified: true,
  isPremium: true,
  availability: "available",
};

describe("AgentCard", () => {
  it("renders agent details correctly", () => {
    render(<AgentCard {...defaultProps} />);

    expect(screen.getByTestId("agent-name")).toHaveTextContent("John Smith");
    expect(screen.getByTestId("agent-brokerage")).toHaveTextContent(
      "Austin Realty Group"
    );
    expect(screen.getByTestId("agent-sales")).toHaveTextContent("156");
    expect(screen.getByTestId("agent-experience")).toHaveTextContent("8");
    expect(screen.getByTestId("agent-review-count")).toHaveTextContent(
      "(42 reviews)"
    );
  });

  it("renders avatar image", () => {
    render(<AgentCard {...defaultProps} />);

    const img = screen.getByTestId("agent-avatar");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
    expect(img).toHaveAttribute("alt", "John Smith");
  });

  it("renders avatar placeholder with initials", () => {
    render(<AgentCard {...defaultProps} avatar={undefined} />);

    expect(screen.getByTestId("agent-avatar-placeholder")).toHaveTextContent(
      "JS"
    );
  });

  it("shows verified badge when verified", () => {
    render(<AgentCard {...defaultProps} />);

    expect(screen.getByTestId("verified-badge")).toBeDefined();
  });

  it("hides verified badge when not verified", () => {
    render(<AgentCard {...defaultProps} isVerified={false} />);

    expect(screen.queryByTestId("verified-badge")).toBeNull();
  });

  it("shows premium badge when premium", () => {
    render(<AgentCard {...defaultProps} />);

    expect(screen.getByTestId("premium-badge")).toHaveTextContent("Premium");
  });

  it("hides premium badge when not premium", () => {
    render(<AgentCard {...defaultProps} isPremium={false} />);

    expect(screen.queryByTestId("premium-badge")).toBeNull();
  });

  it("displays correct availability status", () => {
    render(<AgentCard {...defaultProps} />);

    expect(screen.getByTestId("agent-availability")).toHaveTextContent(
      "Available"
    );
  });

  it("displays busy status", () => {
    render(<AgentCard {...defaultProps} availability="busy" />);

    expect(screen.getByTestId("agent-availability")).toHaveTextContent("Busy");
  });

  it("displays offline status", () => {
    render(<AgentCard {...defaultProps} availability="offline" />);

    expect(screen.getByTestId("agent-availability")).toHaveTextContent(
      "Offline"
    );
  });

  it("renders specialization tags", () => {
    render(<AgentCard {...defaultProps} />);

    const tags = screen.getAllByTestId("specialization-tag");
    expect(tags).toHaveLength(2);
    expect(tags[0]).toHaveTextContent("luxury");
    expect(tags[1]).toHaveTextContent("first-time-buyers");
  });

  it("calls onContact when contact button clicked", () => {
    const onContact = jest.fn();
    render(<AgentCard {...defaultProps} onContact={onContact} />);

    fireEvent.click(screen.getByTestId("contact-button"));

    expect(onContact).toHaveBeenCalledWith("agt_1");
  });

  it("calls onViewProfile when view profile button clicked", () => {
    const onViewProfile = jest.fn();
    render(<AgentCard {...defaultProps} onViewProfile={onViewProfile} />);

    fireEvent.click(screen.getByTestId("view-profile-button"));

    expect(onViewProfile).toHaveBeenCalledWith("agt_1");
  });

  it("does not show contact button when onContact not provided", () => {
    render(<AgentCard {...defaultProps} />);

    expect(screen.queryByTestId("contact-button")).toBeNull();
  });

  it("does not show view profile button when onViewProfile not provided", () => {
    render(<AgentCard {...defaultProps} />);

    expect(screen.queryByTestId("view-profile-button")).toBeNull();
  });

  it("renders star rating", () => {
    render(<AgentCard {...defaultProps} rating={4} />);

    const ratingEl = screen.getByTestId("agent-rating");
    expect(ratingEl).toHaveAttribute("aria-label", "Rating: 4 out of 5");
  });

  it("renders with accessibility", () => {
    render(<AgentCard {...defaultProps} />);

    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("aria-label", "Agent: John Smith");
  });
});
