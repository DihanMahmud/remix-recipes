import {
  useLocation,
  useMatches,
} from "@remix-run/react";
import React, { useEffect, useLayoutEffect } from "react";

export function useMatchsData(id: string) {
  const matches = useMatches();
  // console.log(matches);
  //use useMemo so that it cache the data and for optimization
  const route: any = React.useMemo(
    () => matches.find((route) => route.id === id),
    [matches, id]
  );

  return route?.data;
}

export function isRunningOnServer() {
  return typeof window === "undefined";
}

export const useServerLayoutEffect = isRunningOnServer()
  ? useEffect
  : useLayoutEffect;

let hasHydrated = false;
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = React.useState(hasHydrated);

  React.useEffect(() => {
    hasHydrated = true;
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

// T defines generic func (search it)
export function useDebouncedFunction<T extends Array<any>>(
  fn: (...args: T) => unknown,
  time: number
) {
  const timeoutId = React.useRef<number>();

  // console.log(timeoutId, "42");

  const debouncedFn = (...args: T) => {
    // console.log(    window.clearTimeout(timeoutId.current), "51");

    window.clearTimeout(timeoutId.current);
    // console.log(timeoutId, "48", window.clearTimeout(timeoutId.current));

    timeoutId.current = window.setTimeout(() => fn(...args), time);

    // console.log(    window.clearTimeout(timeoutId.current), "57");
  };

  // console.log(timeoutId, "54");

  return debouncedFn;
}

export function useBuildSearchParams() {
  const location = useLocation();
  // console.log(location);

  return (name: string, value: string) => {
    const searchParam = new URLSearchParams(location.search);
    // console.log(searchParam);
    searchParam.set(name, value);
    // console.log(searchParam);

    return `?${searchParam.toString()}`;
  };
}
