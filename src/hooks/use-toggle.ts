import * as React from "react";

type UseToggleReturn = {
  value: boolean;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
  setValue: React.Dispatch<React.SetStateAction<boolean>>;
};

function useToggle(initialValue: boolean = false): UseToggleReturn {
  const [value, setValue] = React.useState(initialValue);

  const toggle = React.useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setTrue = React.useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = React.useCallback(() => {
    setValue(false);
  }, []);

  return { value, toggle, setTrue, setFalse, setValue };
}

function useToggleMultiple<T extends string>(
  options: T[]
): {
  active: T[];
  toggle: (value: T) => void;
  add: (value: T) => void;
  remove: (value: T) => void;
  clear: () => void;
  has: (value: T) => boolean;
  isActive: (value: T) => boolean;
} {
  const [active, setActive] = React.useState<T[]>([]);

  const toggle = React.useCallback((value: T) => {
    setActive((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const add = React.useCallback((value: T) => {
    setActive((prev) => (prev.includes(value) ? prev : [...prev, value]));
  }, []);

  const remove = React.useCallback((value: T) => {
    setActive((prev) => prev.filter((v) => v !== value));
  }, []);

  const clear = React.useCallback(() => {
    setActive([]);
  }, []);

  const has = React.useCallback(
    (value: T) => active.includes(value),
    [active]
  );

  return { active, toggle, add, remove, clear, has, isActive: has };
}

export { useToggle, useToggleMultiple };
