import {enableDebugLog} from '../flags';

export default function debugLog(msg: any, ...more: any[]) {
  if (enableDebugLog) {
    console.log(msg, ...more);
  }
}
