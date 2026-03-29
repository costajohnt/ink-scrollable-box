import {useEffect, useRef} from 'react';
import {useFocus, useInput} from 'ink';
import type {UseScrollableResult} from './types.js';

export type UseScrollableInputOptions = {
	scroll: UseScrollableResult;
	focusable?: boolean;
	autoFocus?: boolean;
	id?: string;
	enableVimBindings?: boolean;
};

export function useScrollableInput({
	scroll,
	focusable = true,
	autoFocus = false,
	id,
	enableVimBindings = true,
}: UseScrollableInputOptions) {
	const {isFocused} = useFocus({isActive: focusable, autoFocus, id});

	// Use ref to avoid stale closures — scroll object changes every render
	const scrollRef = useRef(scroll);
	useEffect(() => {
		scrollRef.current = scroll;
	});

	useInput(
		(input, key) => {
			const s = scrollRef.current;

			// Ctrl+U / Ctrl+D — always active (before vim checks so ctrl
			// variants don't fall through to plain u/d)
			if (key.ctrl && input === 'u') {
				s.halfPageUp();
				return;
			}

			if (key.ctrl && input === 'd') {
				s.halfPageDown();
				return;
			}

			// Arrow keys, Page Up/Down, Home/End — always active
			if (key.downArrow) {
				s.scrollDown();
				return;
			}

			if (key.upArrow) {
				s.scrollUp();
				return;
			}

			if (key.pageUp) {
				s.pageUp();
				return;
			}

			if (key.pageDown) {
				s.pageDown();
				return;
			}

			if (key.home) {
				s.scrollToTop();
				return;
			}

			if (key.end) {
				s.scrollToBottom();
				return;
			}

			// Vim-style bindings — only when enabled
			if (enableVimBindings) {
				if (input === 'j') {
					s.scrollDown();
					return;
				}

				if (input === 'k') {
					s.scrollUp();
					return;
				}

				if (input === 'g') {
					s.scrollToTop();
					return;
				}

				if (input === 'G') {
					s.scrollToBottom();
					return;
				}

				if (input === 'u') {
					s.pageUp();
					return;
				}

				if (input === 'd') {
					s.pageDown();
				}
			}
		},
		{isActive: isFocused && focusable},
	);

	return {isFocused};
}
