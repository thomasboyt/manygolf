/// <reference path="../node_modules/immutable/dist/immutable.d.ts" />

declare module "randomcolor" {
  function randomColor(): string;

  export = randomColor;
}

/*
 * Vendored from the DefinitelyTyped lodash.d.ts
 */
declare module "lodash.clamp" {
  function clamp(
    number: number,
    lower: number,
    upper?: number
  ): number;

  export = clamp;
}

declare module "lodash.sample" {
  interface List<T> {
    [index: number]: T;
    length: number;
  }

  interface Dictionary<T> {
    [index: string]: T;
  }

  interface NumericDictionary<T> {
    [index: number]: T;
  }

  function sample<T>(
    collection: List<T>|Dictionary<T>|NumericDictionary<T>
  ): T;

  function sample<O extends Object, T>(
    collection: O
  ): T;

  function sample<T>(
    collection: Object
  ): T;

  export = sample;
}

declare module "raven" {
  function patchGlobal(client, cb): void;
}
