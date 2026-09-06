import { useState, useEffect, useRef } from "react";

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const [currentValue, setCurrentValue] = useState<T>(value);

  useEffect(() => {
    ref.current = currentValue;
    setCurrentValue(value);
  }, [value]);

  return ref.current;
}

export function usePreviousDistinct<T>(
  value: T,
  compare?: (a: T, b: T) => boolean
): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const [currentValue, setCurrentValue] = useState<T>(value);

  useEffect(() => {
    const areEqual = compare
      ? compare(ref.current as T, currentValue)
      : ref.current === currentValue;

    if (!areEqual) {
      ref.current = currentValue;
    }

    setCurrentValue(value);
  }, [value, compare, currentValue]);

  return ref.current;
}

export function usePreviousIndex<T>(values: T[]): number | undefined {
  const ref = useRef<number | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(undefined);

  useEffect(() => {
    ref.current = currentIndex;

    const newIndex = values.indexOf(currentValue(values[values.length - 1]));
    setCurrentIndex(newIndex);
  }, [values]);

  return ref.current;
}

function currentValue<T>(value: T | undefined): T {
  return value as T;
}

export default usePrevious;
