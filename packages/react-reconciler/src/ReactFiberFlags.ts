/**
 * We use bitmasks and bitwise operations to manage flags on fiber nodes
 * That's why we use the binary number to represent the flags:
 * 1. Compact Representation: Multiple boolean states are efficiently represented in a single integer.

 * Example:
 * ```javascript
	const UPDATE = 0b0001;
	const PLACEMENT = 0b0010;
	let flags = 0;
	flags |= UPDATE | PLACEMENT; // flags is now 0b0011
	```

 * 2. Efficient Operations: Fast and efficient bitwise operations at the hardware level.
 * Example: flags |= UPDATE; // Set UPDATE flag, flags is now 0b0001

 * 3. Combining Flags: Easily combine multiple flags into a single integer.
 * Example: flags |= PLACEMENT; // Combine UPDATE and PLACEMENT, flags is now 0b0011

 * 4. Checking and Manipulating Flags: Simple and efficient methods to check, set, clear, and toggle specific flags.
 * Example:
 * ```javascript
	if (flags & UPDATE) {
		console.log('Update flag is set'); // This will log 'Update flag is set'
	}
	flags &= ~UPDATE; // Clear UPDATE flag, flags is now 0b0010
	```
 */
export type Flags = number;

export const NoFlags = /*                      */ 0b00000000000000000000;
export const Placement = /*                    */ 0b00000000000000000001;
export const Update = /*                       */ 0b00000000000000000010;
export const ChildDeletion = /*                */ 0b00000000000000000100;
export const Passive = /*                      */ 0b00000000000000001000;

export const MutationMask = Placement | Update | ChildDeletion;
export const PassiveMask = Passive | ChildDeletion;
