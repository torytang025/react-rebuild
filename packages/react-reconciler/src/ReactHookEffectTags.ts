export type HookFlags = number;

export const NoEffectFlags = /*       */ 0b0000;

// Represents whether effect should fire.
export const HasEffect = /*     */ 0b0001;

// Represents the phase in which the effect (not the clean-up) fires.
export const InsertionEffect = /*     */ 0b0010; // useInsertionEffect
export const LayoutEffect = /*        */ 0b0100; // useLayoutEffect
export const PassiveEffect = /*       */ 0b1000; // useEffect
