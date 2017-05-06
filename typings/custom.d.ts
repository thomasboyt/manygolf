/// <reference path="../node_modules/immutable/dist/immutable.d.ts" />

declare module "randomcolor" {
  function randomColor(): string;
  namespace randomColor {}
  export = randomColor;
}

declare module "raven" {
  function patchGlobal(client: any, cb: any): void;
}

// uws uses the exact same interface as ws, soooooo
declare module "uws" {
  import * as ws from 'ws';
  export = ws;
}

declare module "oauth" {
  export var OAuth: any;
}