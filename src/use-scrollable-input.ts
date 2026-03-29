import {useFocus, useInput} from 'ink';
import type {UseScrollableResult} from './types.js';

type UseScrollableInputOptions = {
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

  useInput(
    (input, key) => {
      if (key.downArrow || input === 'j') {
        scroll.scrollDown();
      } else if (key.upArrow || input === 'k') {
        scroll.scrollUp();
      } else if (input === 'g') {
        scroll.scrollToTop();
      } else if (input === 'G') {
        scroll.scrollToBottom();
      } else if (key.pageUp || input === 'u') {
        scroll.pageUp();
      } else if (key.pageDown || input === 'd') {
        scroll.pageDown();
      }
    },
    {isActive: isFocused && focusable},
  );

  return {isFocused};
}
