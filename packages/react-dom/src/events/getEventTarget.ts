import type { AnyNativeEvent } from "./PluginModuleType";

function getEventTarget(nativeEvent: AnyNativeEvent) {
	return nativeEvent.target;
}

export default getEventTarget;
