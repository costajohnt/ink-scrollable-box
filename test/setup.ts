// Lets React's act() flush renders and effects synchronously, so input written
// in tests never races Ink's effect-attached stdin and useInput listeners.
// eslint-disable-next-line unicorn/no-global-object-property-assignment -- React reads this flag from the global object
(globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true;
