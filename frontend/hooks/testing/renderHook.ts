import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

export interface HookHarness<TResult, TProps> {
  /** Latest value returned by the hook. */
  result: { current: TResult };
  /** How many times the host component has rendered since mount. */
  readonly renderCount: number;
  rerender: (nextProps?: TProps) => void;
  unmount: () => void;
}

/**
 * Minimal hook renderer used by the effect-stability tests.
 *
 * It deliberately exposes `renderCount` — the regression these tests guard
 * against is a hook that re-runs its effects on every commit, which is only
 * visible when renders and fetches are counted separately.
 */
export function renderHook<TResult, TProps>(
  callback: (props: TProps) => TResult,
  initialProps: TProps
): HookHarness<TResult, TProps> {
  (
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;

  const result = { current: undefined as TResult };
  let renderCount = 0;
  let currentProps = initialProps;

  function HookHost({ hookProps }: { hookProps: TProps }) {
    renderCount += 1;
    result.current = callback(hookProps);
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const render = (props: TProps) => {
    currentProps = props;
    act(() => {
      root.render(createElement(HookHost, { hookProps: props }));
    });
  };

  render(initialProps);

  return {
    result,
    get renderCount() {
      return renderCount;
    },
    rerender: (nextProps?: TProps) => {
      render(nextProps === undefined ? currentProps : nextProps);
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

/** Flushes pending promise callbacks and effect-driven state updates. */
export async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}
