interface options {
  inner?: boolean;
}

type markup = string | HTMLElement | HTMLElement[];

declare module "diffhtml" {
  function outerHTML(container: HTMLElement, markup: markup): void;
  function innerHTML(container: HTMLElement, markup: markup): void;

  function element(originalElement: HTMLElement, newElement: HTMLElement, options?: options): void;
  function release(element: HTMLElement): void;

  // TODO: depending on name passed here, callback should have different arguments:
  // https://github.com/tbranyen/diffhtml#add-a-transition-state-callback
  // for now a function with any arguments is allowed
  // function addTransitionState(name: string, callback: ???): void;

  function addTransitionState(name: string, callback: Function): void;

  function removeTransitionState(): void;
  function removeTransitionState(name: string): void;
  function removeTransitionState(name: string, callback: Function): void;

  function html(markup: TemplateStringsArray, ...values: any[]): HTMLElement;
}