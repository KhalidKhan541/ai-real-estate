import * as React from "react";

interface UseKeyPressOptions {
  targetKey: string;
  modifier?: "ctrl" | "meta" | "shift" | "alt";
  enabled?: boolean;
  onKeyDown?: () => void;
  onKeyUp?: () => void;
}

function useKeyPress({
  targetKey,
  modifier,
  enabled = true,
  onKeyDown,
  onKeyUp,
}: UseKeyPressOptions): boolean {
  const [isPressed, setIsPressed] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (modifier) {
        const modifierMap: Record<string, boolean> = {
          ctrl: event.ctrlKey,
          meta: event.metaKey,
          shift: event.shiftKey,
          alt: event.altKey,
        };
        if (!modifierMap[modifier]) return;
      }

      if (event.key === targetKey) {
        setIsPressed(true);
        onKeyDown?.();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setIsPressed(false);
        onKeyUp?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [targetKey, modifier, enabled, onKeyDown, onKeyUp]);

  return isPressed;
}

function useKeyPressCombo(
  combo: string,
  callback: () => void,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  React.useEffect(() => {
    if (!enabled) return;

    const keys = combo.toLowerCase().split("+");
    const targetKey = keys[keys.length - 1];
    const modifiers = keys.slice(0, -1);

    const handler = (event: KeyboardEvent) => {
      const modifierChecks: Record<string, boolean> = {
        ctrl: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
        alt: event.altKey,
      };

      const allModifiersPressed = modifiers.every(
        (mod) => modifierChecks[mod]
      );

      if (allModifiersPressed && event.key.toLowerCase() === targetKey) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [combo, callback, enabled]);
}

export { useKeyPress, useKeyPressCombo };
