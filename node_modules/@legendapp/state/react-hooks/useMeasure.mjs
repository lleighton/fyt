import { useObservable } from '@legendapp/state/react';
import { useLayoutEffect } from 'react';

// src/react-hooks/useMeasure.ts
function getSize(el) {
  return el ? {
    width: el.offsetWidth,
    height: el.offsetHeight
  } : void 0;
}
function useMeasure(ref) {
  const obs = useObservable({
    width: void 0,
    height: void 0
  });
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) {
      const handleResize = () => {
        if (ref.current) {
          const oldSize = obs.peek();
          const newSize = getSize(ref.current);
          if (newSize && (newSize.width !== oldSize.width || newSize.height !== oldSize.height)) {
            obs.set(newSize);
          }
        }
      };
      handleResize();
      let resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(el);
      return () => {
        resizeObserver.disconnect();
        resizeObserver = void 0;
      };
    }
  }, [ref.current]);
  return obs;
}

export { useMeasure };
