import { useEffect, useState } from "react";

export function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const step = () => {
      start += increment;
      if (start < target) {
        setValue(start);
        requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };
    requestAnimationFrame(step);
  }, [target,duration]);

  return value;
}