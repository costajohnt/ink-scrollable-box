import {useEffect, useRef} from 'react';
import {useFocus, useInput} from 'ink';
import type {UseScrollableResult} from './types.js';

export type UseScrollableInputOptions = {
  scroll: UseScrollableResult;
  focusable?: boolean;
  id?: string;
};

export function useScrollableInput({
  scroll,
  focusable = true,
  id,
}: UseScrollableInputOptions) {
  const {isFocused} = useFocus({isActive: focusable, id});

  // Use ref to avoid stale closures — scroll object changes every render
  const scrollRef = useRef(scroll);
  useEffect(() => {
    scrollRef.current = scroll;
  });

  useInput(
    (input, key) => {
      const s = scrollRef.current;
      if (key.downArrow || input === 'j') {
        s.scrollDown();
      } else if (key.upArrow || input === 'k') {
        s.scrollUp();
      } else if (input === 'g') {
        s.scrollToTop();
      } else if (input === 'G') {
        s.scrollToBottom();
      } else if (key.pageUp || input === 'u') {
        s.pageUp();
      } else if (key.pageDown || input === 'd') {
        s.pageDown();
      } else if (key.home) {
        s.scrollToTop();
      } else if (key.end) {
        s.scrollToBottom();
      }
    },
    {isActive: isFocused && focusable},
  );

  return {isFocused};
}
