/** Global browser globals provided by the SillyTavern page. */
declare const $: JQueryStatic;
declare const toastr: {
  info: (msg?: string, title?: string, opts?: object) => void;
  success: (msg?: string, title?: string, opts?: object) => void;
  warning: (msg?: string, title?: string, opts?: object) => void;
  error: (msg?: string, title?: string, opts?: object) => void;
};

declare module '*.css?inline' {
  const css: string;
  export default css;
}
