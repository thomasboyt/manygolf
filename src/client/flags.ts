import {getFlag, flagTypes} from './util/featureFlags';

export const debugRender: boolean = getFlag('debugRender', flagTypes.bool, false);
export const enableDebugLog: boolean = getFlag('log', flagTypes.bool, false);