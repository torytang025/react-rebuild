import { logger } from "shared/logger";

export type SchedulerCallback = () => void | null;

let syncQueue: Array<SchedulerCallback> | null = null;
let isFlushingSyncQueue: boolean = false;

export function scheduleSyncCallback(callback: SchedulerCallback): void {
	if (syncQueue === null) {
		syncQueue = [callback];
	} else {
		syncQueue.push(callback);
	}
}

export function flushSyncCallbacks(): void {
	if (!isFlushingSyncQueue && syncQueue !== null) {
		isFlushingSyncQueue = true;

		try {
			syncQueue.forEach((callback) => callback());
		} catch (err) {
			return logger.error("Error while flushing sync queue", err);
		} finally {
			syncQueue = null;
			isFlushingSyncQueue = false;
		}
	}
}
