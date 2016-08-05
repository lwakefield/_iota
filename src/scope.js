export default function exposeScope (code, scope=null, ...toExpose) {
    if (code instanceof Function) {
        code = `return (${code.toString()}).bind(this)()`;
    }
    let params = [].concat(toExpose.map(v => Object.keys(v))).join(',');

    let aliases = toExpose.map((v, k) => `__alias${k}`)
    let aliasRefs = [].concat(toExpose.map((v, k) => {
        return Object.keys(v).map(v1 => `__alias${k}.${v1}`)
    })).join(',');

    return new Function(...aliases, `
        return (function (${params}) {
            ${code}
        }).bind(this)(${aliasRefs});
    `).bind(scope, ...toExpose)
}
