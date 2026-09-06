import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

interface TourScene {
  id: string;
  name: string;
  type: string;
  mediaUrl: string;
  thumbnailUrl?: string;
}

interface TourViewerProps {
  tourId: string;
  scenes: TourScene[];
  currentSceneId?: string;
  onSceneChange?: (sceneId: string) => void;
  onFullscreen?: () => void;
}

function TourViewer({
  tourId,
  scenes,
  currentSceneId: initialSceneId,
  onSceneChange,
  onFullscreen,
}: TourViewerProps) {
  const [currentSceneId, setCurrentSceneId] = React.useState(
    initialSceneId || scenes[0]?.id
  );
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);

  const currentScene = scenes.find((s) => s.id === currentSceneId);

  const goToScene = (sceneId: string) => {
    setCurrentSceneId(sceneId);
    onSceneChange?.(sceneId);
  };

  const goToNext = () => {
    const currentIndex = scenes.findIndex((s) => s.id === currentSceneId);
    if (currentIndex < scenes.length - 1) {
      goToScene(scenes[currentIndex + 1].id);
    }
  };

  const goToPrevious = () => {
    const currentIndex = scenes.findIndex((s) => s.id === currentSceneId);
    if (currentIndex > 0) {
      goToScene(scenes[currentIndex - 1].id);
    }
  };

  if (!currentScene) {
    return (
      <div data-testid="tour-viewer-empty" className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No scenes available</p>
      </div>
    );
  }

  return (
    <div data-testid="tour-viewer" className="space-y-4">
      <div className="relative">
        <div
          className="relative h-96 overflow-hidden rounded-lg bg-black"
          data-testid="scene-display"
        >
          <img
            src={currentScene.mediaUrl}
            alt={currentScene.name}
            className="h-full w-full object-contain"
            data-testid="scene-image"
          />

          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 hover:bg-white disabled:opacity-50"
            disabled={scenes.findIndex((s) => s.id === currentSceneId) === 0}
            data-testid="prev-button"
            aria-label="Previous scene"
          >
            ←
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 hover:bg-white disabled:opacity-50"
            disabled={
              scenes.findIndex((s) => s.id === currentSceneId) ===
              scenes.length - 1
            }
            data-testid="next-button"
            aria-label="Next scene"
          >
            →
          </button>

          <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-sm text-white" data-testid="scene-counter">
            {scenes.findIndex((s) => s.id === currentSceneId) + 1} /{" "}
            {scenes.length}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900" data-testid="scene-name">
            {currentScene.name}
          </h3>
          <p className="text-sm text-gray-500" data-testid="scene-type">
            {currentScene.type.charAt(0).toUpperCase() + currentScene.type.slice(1)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            data-testid="play-button"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            data-testid="mute-button"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              data-testid="fullscreen-button"
            >
              Fullscreen
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2" data-testid="scene-thumbnails">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => goToScene(scene.id)}
            className={`flex-shrink-0 rounded-lg border-2 p-1 ${
              scene.id === currentSceneId
                ? "border-emerald-600"
                : "border-transparent hover:border-gray-300"
            }`}
            data-testid={`thumb-${scene.id}`}
            aria-label={`Go to ${scene.name}`}
          >
            <img
              src={scene.thumbnailUrl || scene.mediaUrl}
              alt={scene.name}
              className="h-16 w-24 rounded object-cover"
            />
            <p className="mt-1 text-xs text-gray-600 truncate w-24">
              {scene.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

const mockScenes: TourScene[] = [
  { id: "s1", name: "Living Room", type: "room", mediaUrl: "https://example.com/living.jpg" },
  { id: "s2", name: "Kitchen", type: "room", mediaUrl: "https://example.com/kitchen.jpg" },
  { id: "s3", name: "Exterior", type: "exterior", mediaUrl: "https://example.com/exterior.jpg" },
];

describe("TourViewer", () => {
  it("renders the tour viewer", () => {
    render(<TourViewer tourId="tour_1" scenes={mockScenes} />);

    expect(screen.getByTestId("tour-viewer")).toBeDefined();
    expect(screen.getByTestId("scene-display")).toBeDefined();
    expect(screen.getByTestId("scene-image")).toBeDefined();
  });

  it("displays first scene by default", () => {
    render(<TourViewer tourId="tour_1" scenes={mockScenes} />);

    expect(screen.getByTestId("scene-name")).toHaveTextContent("Living Room");
    expect(screen.getByTestId("scene-image")).toHaveAttribute(
      "src",
      "https://example.com/living.jpg"
    );
  });

  it("shows scene counter", () => {
    render(<TourViewer tourId="tour_1" scenes={mockScenes} />);

    expect(screen.getByTestId("scene-counter")).toHaveTextContent("1 / 3");
  });

  it("navigates to next scene", () => {
    render(<TourViewer tourId="tour_1" scenes={mockScenes} />);

    fireEvent.click(screen.getByTestId("next-button"));

    expect(screen.getByTestId("scene-name")).toHaveTextContent("Kitchen");
    expect(screen.getByTestId("scene-counter")).toHaveTextContent("2 / 3");
  });

  it("navigates to previous scene", () => {
    render(
      <TourViewer
        tourId="tour_1"
        scenes={mockScenes}
        currentSceneId="s2"
      />
    );

    fireEvent.click(screen.getByTestId("prev-button"));

    expect(screen.getByTestId("scene-name")).toHaveTextContent("Living Room");
  });

  it("disables previous button on first scene", () => {
    render(<TourViewer tourId="tour_1" scenes={mockScenes} />);

    expect(screen.getByTestId("prev-button")).toBeDisabled();
  });

  it("disables next button on last scene", () => {
    render(
      <TourViewer
        tourId="tour_1"
        scenes={mockScenes}
        currentSceneId="s3"
      />
    );

    expect(screen.getByTestId("next-button")).toBeDisabled();
  });

  it("calls onSceneChange when scene changes", () => {
    const onSceneChange = jest.fn();
    render(
      <TourViewer
        tourId="tour_1"
        scenes={mockScenes}
        onSceneChange={onSceneChange}
      />
    );

    fireEvent.click(screen.getByTestId("next-button"));

    expect(onSceneChange).toHaveBeenCalledWith("s2");
  });

  it("renders scene thumbnails", () => {
    render(<TourViewer tourId="tour_1" scenes={mockScenes} />);

    const thumbnails = screen.getByTestId("scene-thumbnails");
    expect(thumbnails.children).toHaveLength(3);
  });

  it("navigates to scene via thumbnail", () => {
    render(<TourViewer tourId="tour_1" scenes={mockScenes} />);

    fireEvent.click(screen.getByTestId("thumb-s3"));

    expect(screen.getByTestId("scene-name")).toHaveTextContent("Exterior");
  });

  it("shows play/pause button", () => {
    render(<TourViewer tourId="tour_1" scenes={mockScenes} />);

    expect(screen.getByTestId("play-button")).toHaveTextContent("Play");

    fireEvent.click(screen.getByTestId("play-button"));

    expect(screen.getByTestId("play-button")).toHaveTextContent("Pause");
  });

  it("shows mute/unmute button", () => {
    render(<TourViewer tourId="tour_1" scenes={mockScenes} />);

    expect(screen.getByTestId("mute-button")).toHaveTextContent("Mute");

    fireEvent.click(screen.getByTestId("mute-button"));

    expect(screen.getByTestId("mute-button")).toHaveTextContent("Unmute");
  });

  it("shows fullscreen button when onFullscreen provided", () => {
    const onFullscreen = jest.fn();
    render(
      <TourViewer
        tourId="tour_1"
        scenes={mockScenes}
        onFullscreen={onFullscreen}
      />
    );

    expect(screen.getByTestId("fullscreen-button")).toBeDefined();

    fireEvent.click(screen.getByTestId("fullscreen-button"));

    expect(onFullscreen).toHaveBeenCalled();
  });

  it("hides fullscreen button when onFullscreen not provided", () => {
    render(<TourViewer tourId="tour_1" scenes={mockScenes} />);

    expect(screen.queryByTestId("fullscreen-button")).toBeNull();
  });

  it("shows empty state when no scenes", () => {
    render(<TourViewer tourId="tour_1" scenes={[]} />);

    expect(screen.getByTestId("tour-viewer-empty")).toHaveTextContent(
      "No scenes available"
    );
  });

  it("starts at specified scene", () => {
    render(
      <TourViewer
        tourId="tour_1"
        scenes={mockScenes}
        currentSceneId="s2"
      />
    );

    expect(screen.getByTestId("scene-name")).toHaveTextContent("Kitchen");
    expect(screen.getByTestId("scene-counter")).toHaveTextContent("2 / 3");
  });

  it("shows scene type", () => {
    render(<TourViewer tourId="tour_1" scenes={mockScenes} />);

    expect(screen.getByTestId("scene-type")).toHaveTextContent("Room");
  });
});
