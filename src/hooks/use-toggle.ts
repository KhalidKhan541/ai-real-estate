import { useState, useCallback } from "react";

export function useToggle(initialValue: boolean = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const set = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return [value, toggle, set];
}

export function useToggleMultiple<T extends string>(
  initialValues: Record<T, boolean>
): [Record<T, boolean>, (key: T) => void, (values: Partial<Record<T, boolean>>) => void, () => void] {
  const [values, setValues] = useState<Record<T, boolean>>(initialValues);

  const toggle = useCallback((key: T) => {
    setValues((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const setMultiple = useCallback((newValues: Partial<Record<T, boolean>>) => {
    setValues((prev) => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return [values, toggle, setMultiple, reset];
}

export function useCounter(
  initialValue: number = 0,
  options?: {
    min?: number;
    max?: number;
    step?: number;
  }
): {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  set: (value: number) => void;
  isAtMin: boolean;
  isAtMax: boolean;
} {
  const [count, setCount] = useState(initialValue);
  const { min = -Infinity, max = Infinity, step = 1 } = options || {};

  const increment = useCallback(() => {
    setCount((prev) => Math.min(prev + step, max));
  }, [step, max]);

  const decrement = useCallback(() => {
    setCount((prev) => Math.max(prev - step, min));
  }, [step, min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const set = useCallback(
    (value: number) => {
      setCount(Math.max(min, Math.min(max, value)));
    },
    [min, max]
  );

  const isAtMin = count <= min;
  const isAtMax = count >= max;

  return {
    count,
    increment,
    decrement,
    reset,
    set,
    isAtMin,
    isAtMax,
  };
}

export function useBoolean(
  initialValue: boolean = false
): [boolean, () => void, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const setValue_ = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return [value, setTrue, setFalse, setValue_];
}

export function useSelection<T>(
  options: T[] = [],
  multiple: boolean = false
): {
  selected: T | T[] | null;
  select: (item: T) => void;
  deselect: () => void;
  isSelected: (item: T) => boolean;
  toggle: (item: T) => void;
} {
  const [selected, setSelected] = useState<T | T[] | null>(null);

  const select = useCallback(
    (item: T) => {
      if (multiple) {
        setSelected((prev) => {
          if (Array.isArray(prev)) {
            return [...prev, item];
          }
          return [item];
        });
      } else {
        setSelected(item);
      }
    },
    [multiple]
  );

  const deselect = useCallback(() => {
    if (multiple) {
      setSelected([]);
    } else {
      setSelected(null);
    }
  }, [multiple]);

  const isSelected = useCallback(
    (item: T) => {
      if (Array.isArray(selected)) {
        return selected.includes(item);
      }
      return selected === item;
    },
    [selected]
  );

  const toggle = useCallback(
    (item: T) => {
      if (isSelected(item)) {
        if (multiple) {
          setSelected((prev) => {
            if (Array.isArray(prev)) {
              return prev.filter((i) => i !== item);
            }
            return [];
          });
        } else {
          setSelected(null);
        }
      } else {
        select(item);
      }
    },
    [isSelected, multiple, select]
  );

  return {
    selected,
    select,
    deselect,
    isSelected,
    toggle,
  };
}

export default useToggle;
