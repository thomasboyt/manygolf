// Type definitions for Expect v1.20.1
// Project: https://github.com/mjackson/expect
// Definitions by: Justin Reidy <https://github.com/jmreidy/> and Thomas Boyt <https://github.com/thomasboyt>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module "expect" {
    export class Expectation {
      constructor(actual:any);

      toExist(message?:string):Expectation;
      toBeTruthy(message?:string):Expectation;

      toNotExist(message?:string):Expectation;
      toBeFalsy(message?:string):Expectation;

      toBe(value:any, message?:string):Expectation;

      toNotBe(value:any, message?:string):Expectation;

      toEqual(value:any, message?:string):Expectation;

      toNotEqual(value:any, message?:string):Expectation;

      toThrow(value?:any, message?:string):Expectation;

      toNotThrow(value?:any, message?:string):Expectation;

      toBeA(value:any, message?:string):Expectation;
      toBeAn(value:any, message?:string):Expectation;

      toNotBeA(value:any, message?:string):Expectation;
      toNotBeAn(value:any, message?:string):Expectation;

      toMatch(value:any, message?:string):Expectation;

      toNotMatch(value:any, message?:string):Expectation;

      toBeLessThan(value:any, message?:string):Expectation;
      toBeFewerThan(value:any, message?:string):Expectation;

      toBeLessThanOrEqualTo(value:any, message?:string):Expectation;

      toBeGreaterThan(value:any, message?:string):Expectation;
      toBeMoreThan(value:any, message?:string):Expectation;

      toBeGreaterThanOrEqualTo(value:any, message?:string):Expectation;

      toInclude(value:any, compareValues?:any, message?:string):Expectation;
      toContain(value:any, compareValues?:any, message?:string):Expectation;

      toExclude(value:any, compareValues?:any, message?:string):Expectation;
      toNotContain(value:any, compareValues?:any, message?:string):Expectation;
      toNotInclude(value:any, compareValues?:any, message?:string):Expectation;

      toIncludeKey(key: string, compareValues?: any, message?: string): Expectation;
      toContainKey(key: string, compareValues?: any, message?: string): Expectation;

      toIncludeKeys(keys: string[], compareValues?: any, message?: string): Expectation;
      toContainKeys(keys: string[], compareValues?: any, message?: string): Expectation;

      toExcludeKey(key: string, compareValues?: any, message?: string): Expectation;
      toNotContainKey(key: string, compareValues?: any, message?: string): Expectation;
      toNotIncludeKey(key: string, compareValues?: any, message?: string): Expectation;

      toExcludeKeys(keys: string[], compareValues?: any, message?: string): Expectation;
      toNotContainKeys(keys: string[], compareValues?: any, message?: string): Expectation;
      toNotIncludeKeys(keys: string[], compareValues?: any, message?: string): Expectation;

      toHaveBeenCalled(message?:string):Expectation;

      toNotHaveBeenCalled(message?:string):Expectation;

      toHaveBeenCalledWith(...args:Array<any>):Expectation;
    }

    export interface Extension {
      [name:string]:(args?:Array<any>) => void;
    }

    export interface Call {
      context: Spy;
      arguments: Array<any>;
    }

    export interface Spy {
      __isSpy:Boolean;
      calls:Array<Call>;
      andCall(fn:Function):Spy;
      andCallThrough():Spy;
      andThrow(object:Object):Spy;
      andReturn(value:any):Spy;
      getLastCall():Call;
      restore():void;
      destroy():void;
      reset():void;
    }

    function expect(actual:any):Expectation;

    export function createSpy(fn?:Function, restore?:Function):Spy;
    export function spyOn(object:Object, methodName:string):Spy;
    export function isSpy(object:any):Boolean;
    export function restoreSpies():void;
    export function assert(condition:any, messageFormat:string, ...extraArgs:Array<any>):void;
    export function extend(extension:Extension):void;

    export default expect;
}