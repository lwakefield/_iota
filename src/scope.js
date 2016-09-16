/**
 * This is the magic exposeScope Function.
 * exposeScope returns a Function, with some scope exposed
 *   that would not ordinarily be accessible.
 *
 * ex.
 *   // user.name does not exist in the global scope.
 *   let data = {
 *     user: {
 *       name: 'Fred'
 *     }
 *   };
 *   // user.name is not ordinarily available in foo()
 *   function foo () { return user.name }
 *   // This returns our magic function that resolves the scope
 *   let fn = exposeScope(foo, data, data);
 *   fn();
 *   // Fred
 */
export default function exposeScope (code, scope = null, ...toExpose) {
    if (code instanceof Function) {
        code = `(${code.toString()}).call(this)`;
    }

    const aliases = toExpose.map((v, k) => `__alias${k}`);
    const withs = aliases.map(v => `with (${v})`).join(' ');

    // eslint-disable-next-line
    return new Function(...aliases,
        `${withs} {
            return (() => {'use strict'; return ${code} })
        }`)
    .call(scope, ...toExpose);
}
