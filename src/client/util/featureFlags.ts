import * as qs from 'qs';

// TODO: if we're in a test mode it'd be nice not to have to set document.location.search... pull
// from global or something instead?
const query = document.location.search.slice(1);  // lop off leading question mark
const qsObj = qs.parse(query.toLowerCase());

type FlagType<T> = (value: string, name: string) => T;

const bool: FlagType<boolean> = (value: string, name: string): boolean => {
  // this is a bool
  if (value === '') {
    return true;
  } else if (value === '0' || value === 'false') {
    return false;
  } else if (value === '1' || value === 'true') {
    return true;
  } else {
    throw new Error(`could not parse boolean flag ${name}`);
  }
};

export const flagTypes = {
  bool,
};

export function getFlag<T>(name: string, type: FlagType<T>, defaultValue: T): T {
  const key = name.toLowerCase();

  if (qsObj[key] !== undefined) {
    const value = type(qsObj[key], name);

    if (value !== defaultValue) {
      console.info(`*** Feature flag overridden: ${name} = ${value}`);
    }
    return value;

  } else {
    return defaultValue;
  }
}
