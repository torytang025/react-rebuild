import type { FiberNode } from "react-reconciler/ReactFiber";
import { hasOwnProperty } from "shared/hasOwnProperty";

import type { AnyNativeEvent } from "./PluginModuleType";
import type { ReactSyntheticEvent } from "./ReactSyntheticEventType";
import type { BaseSyntheticEvent } from "./ReactSyntheticEventType";

function functionThatReturnsTrue() {
	return true;
}

function functionThatReturnsFalse() {
	return false;
}

export class SyntheticBaseEvent<T extends Record<string, any>>
	implements BaseSyntheticEvent
{
	_reactName: string | null;
	_targetInst: FiberNode | null;
	type: string;
	nativeEvent: AnyNativeEvent;
	target: null | EventTarget;
	currentTarget: null | EventTarget;
	isDefaultPrevented: () => boolean;
	isPropagationStopped: () => boolean;

	constructor(
		reactName: string | null,
		reactEventType: string,
		targetInst: FiberNode | null,
		nativeEvent: AnyNativeEvent,
		nativeEventTarget: null | EventTarget,
		Interface: T,
	) {
		this._reactName = reactName;
		this._targetInst = targetInst;
		this.type = reactEventType;
		this.nativeEvent = nativeEvent;
		this.target = nativeEventTarget;
		this.currentTarget = null;

		for (const propName in Interface) {
			if (hasOwnProperty(Interface, propName)) {
				continue;
			}
			const normalize = Interface[propName];
			if (normalize) {
				(this as any)[propName] =
					typeof normalize === "function" ? normalize(nativeEvent) : normalize;
			} else {
				(this as any)[propName] = nativeEvent[
					propName as keyof AnyNativeEvent
				] as any;
			}
		}

		const defaultPrevented = nativeEvent.defaultPrevented;
		if (defaultPrevented) {
			this.isDefaultPrevented = functionThatReturnsTrue;
		} else {
			this.isDefaultPrevented = functionThatReturnsFalse;
		}
		this.isPropagationStopped = functionThatReturnsFalse;
	}

	preventDefault() {
		const event = this.nativeEvent;
		if (!event) return;

		if (event.preventDefault) {
			event.preventDefault();
		}

		this.isDefaultPrevented = functionThatReturnsTrue;
	}

	stopPropagation() {
		const event = this.nativeEvent;
		if (!event) return;

		if (event.stopPropagation) {
			event.stopPropagation();
		}

		this.isPropagationStopped = functionThatReturnsTrue;
	}
}

function createSyntheticEvent<T extends Record<string, any>>(Interface: T) {
	return (
		reactName: string | null,
		reactEventType: string,
		targetInst: FiberNode | null,
		nativeEvent: AnyNativeEvent,
		nativeEventTarget: null | EventTarget,
	) =>
		new SyntheticBaseEvent(
			reactName,
			reactEventType,
			targetInst,
			nativeEvent,
			nativeEventTarget,
			Interface,
		);
}

const EventInterface = {
	eventPhase: 0,
	bubbles: false,
	cancelable: false,
	defaultPrevented: false,
	isTrusted: false,
};

export const SyntheticEvent = createSyntheticEvent(EventInterface);
