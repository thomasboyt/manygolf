import {getFlag, flagTypes} from './util/featureFlags';

export const useNewNetcode: boolean = getFlag('newNetcode', flagTypes.bool, false);
export const debugRender: boolean = getFlag('debugRender', flagTypes.bool, false);