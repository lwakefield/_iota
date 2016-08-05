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
export default function exposeScope (code, scope=null, ...toExpose) {
    if (code instanceof Function) {
        code = `return (${code.toString()}).bind(this)()`;
    }
    let params = [].concat(toExpose.map(v => Object.keys(v)))
        .filter(v => v.length)
        .join(',');

    let aliases = toExpose.map((v, k) => `__alias${k}`)
    let aliasRefs = [].concat(toExpose.map((v, k) => {
        return Object.keys(v).map(v1 => `__alias${k}.${v1}`)
    }))
        .filter(v => v.length)
        .join(',');

    return new Function(...aliases, `
        return (function (${params}) {
            ${code}
        }).bind(this)(${aliasRefs});
    `).bind(scope, ...toExpose)
}
