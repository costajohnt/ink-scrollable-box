export type ScrollState = {
  /** Current scroll offset (0-based line index at top of viewport) */
  offset: number;
  /** Total content height in lines */
  contentHeight: number;
  /** Visible viewport height in lines */
  viewportHeight: number;
  /** Whether content exists above the viewport */
  canScrollUp: boolean;
  /** Whether content exists below the viewport */
  canScrollDown: boolean;
  /** Whether viewport is at the very top */
  isAtTop: boolean;
  /** Whether viewport is at the very bottom */
  isAtBottom: boolean;
  /** Scroll position as 0-100 percentage */
  percentage: number;
};

export type ScrollActions = {
  /** Scroll up by scrollStep lines */
  scrollUp: () => void;
  /** Scroll down by scrollStep lines */
  scrollDown: () => void;
  /** Jump to a specific offset (clamped to valid range) */
  scrollTo: (offset: number) => void;
  /** Jump to the top */
  scrollToTop: () => void;
  /** Jump to the bottom */
  scrollToBottom: () => void;
  /** Scroll up by one viewport height */
  pageUp: () => void;
  /** Scroll down by one viewport height */
  pageDown: () => void;
};

export type UseScrollableOptions = {
  /** Total content height in lines */
  contentHeight: number;
  /** Visible viewport height in lines */
  viewportHeight: number;
  /** Lines per scroll step (default: 1) */
  scrollStep?: number;
  /** Auto-scroll to bottom when contentHeight grows (default: false) */
  followOutput?: boolean;
  /** Starting scroll position (default: 0) */
  initialOffset?: number;
};

export type UseScrollableResult = ScrollState & ScrollActions;

export type ScrollbarProps = {
  contentHeight: number;
  viewportHeight: number;
  offset: number;
  isFocused: boolean;
  thumbCharacter?: string;
  trackCharacter?: string;
  thumbColor?: string;
  thumbDimColor?: string;
  trackColor?: string;
};

export type ScrollableBoxProps = {
  /** Viewport height in terminal lines (required) */
  height: number;
  /** String content — performance mode (mutually exclusive with children) */
  lines?: string[];
  /**
   * React children — ergonomic mode (mutually exclusive with lines).
   * Each child is assumed to render as exactly 1 terminal line.
   * Multi-line children (e.g., wrapped text) will cause scroll math
   * to be incorrect. Use `lines` mode for predictable behavior.
   */
  children?: React.ReactNode;
  /** Auto-scroll to bottom when content grows (default: false) */
  followOutput?: boolean;
  /** Lines per arrow key press (default: 1) */
  scrollStep?: number;
  /** Draw rounded border around viewport (default: false) */
  border?: boolean;
  /** Show proportional scrollbar (default: true) */
  showScrollbar?: boolean;
  /** Show overflow indicators (default: true) */
  showIndicators?: boolean;
  /** Participate in Tab focus cycle (default: true) */
  focusable?: boolean;
  /** Focus ID for programmatic focus */
  id?: string;
  /** Scroll event callback */
  onScroll?: (state: ScrollState) => void;
  /** Scrollbar thumb character (default: █) */
  scrollbarCharacter?: string;
  /** Scrollbar track character (default: ░) */
  trackCharacter?: string;
  /** Up overflow indicator (default: ▲) */
  upIndicator?: string;
  /** Down overflow indicator (default: ▼) */
  downIndicator?: string;
  /** Scrollbar thumb color when focused */
  scrollbarColor?: string;
  /** Scrollbar thumb color when unfocused */
  scrollbarDimColor?: string;
  /** Track color */
  trackColor?: string;
  /** Border color when focused */
  borderColor?: string;
  /** Border color when unfocused (default: gray) */
  borderDimColor?: string;
};
