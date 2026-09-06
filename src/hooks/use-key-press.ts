import { useEffect, useCallback, useRef } from "react";

export type KeyHandler = (event: KeyboardEvent) => void;

export interface UseKeyPressOptions {
  enabled?: boolean;
  target?: EventTarget;
  capture?: boolean;
}

export function useKeyPress(
  targetKey: string | string[],
  handler: KeyHandler,
  options?: UseKeyPressOptions
): void {
  const handlerRef = useRef(handler);
  const enabled = options?.enabled ?? true;
  const target = options?.target;
  const capture = options?.capture ?? false;

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const keys = Array.isArray(targetKey) ? targetKey : [targetKey];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (keys.includes(event.key)) {
        handlerRef.current(event);
      }
    };

    const eventTarget = target || document;
    const eventType = capture ? "keydown" : "keydown";

    eventTarget.addEventListener(eventType, handleKeyDown as EventListener);
    return () => {
      eventTarget.removeEventListener(eventType, handleKeyDown as EventListener);
    };
  }, [targetKey, enabled, target, capture]);
}

export function useKeyCombo(
  keys: string[],
  handler: KeyHandler,
  options?: UseKeyPressOptions
): void {
  const handlerRef = useRef(handler);
  const pressedKeys = useRef(new Set<string>());
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.current.add(event.key);

      const allKeysPressed = keys.every((key) => pressedKeys.current.has(key));
      if (allKeysPressed) {
        handlerRef.current(event);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.key);
    };

    const handleBlur = () => {
      pressedKeys.current.clear();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [keys, enabled]);
}

export function useEscapeKey(
  handler: KeyHandler,
  options?: UseKeyPressOptions
): void {
  useKeyPress("Escape", handler, options);
}

export function useEnterKey(
  handler: KeyHandler,
  options?: UseKeyPressOptions
): void {
  useKeyPress("Enter", handler, options);
}

export function useArrowKeys(
  handlers: {
    up?: KeyHandler;
    down?: KeyHandler;
    left?: KeyHandler;
    right?: KeyHandler;
  },
  options?: UseKeyPressOptions
): void {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useKeyPress(
    "ArrowUp",
    (event) => handlersRef.current.up?.(event),
    options
  );
  useKeyPress(
    "ArrowDown",
    (event) => handlersRef.current.down?.(event),
    options
  );
  useKeyPress(
    "ArrowLeft",
    (event) => handlersRef.current.left?.(event),
    options
  );
  useKeyPress(
    "ArrowRight",
    (event) => handlersRef.current.right?.(event),
    options
  );
}

export function useModifierKey(
  modifier: "ctrl" | "shift" | "alt" | "meta",
  key: string,
  handler: KeyHandler,
  options?: UseKeyPressOptions
): void {
  const handlerRef = useRef(handler);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      let modifierPressed = false;

      switch (modifier) {
        case "ctrl":
          modifierPressed = event.ctrlKey || event.metaKey;
          break;
        case "shift":
          modifierPressed = event.shiftKey;
          break;
        case "alt":
          modifierPressed = event.altKey;
          break;
        case "meta":
          modifierPressed = event.metaKey;
          break;
      }

      if (modifierPressed && event.key.toLowerCase() === key.toLowerCase()) {
        handlerRef.current(event);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modifier, key, enabled]);
}

export default useKeyPress;
