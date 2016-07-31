import { $toArray } from '~/util';
import serialize from '~/serialize';

const toArray = v => [].slice.call(v);

/**
 * This function recursively parses the DOM into a vdom
 * The vdom is made up of Objects and Functions
 * Static elements will be rendered as an Object
 * Interpolated or Directive based elements are rendered as a Function.
 * Calling the Function directly will yield errors. This is because the Function
 *   references properties that are not available in scope.
 */
export function parse (el) {
    if (el.splitText) {
        let text = el.textContent;

        return needsInterpolation(text)
            ? interpolate(text)
            : text;
    }

    let tagName = el.tagName.toLowerCase();
    let attrs = {};
    toArray(el.attributes).forEach(v => {
        attrs[v.name] = v.value;
    });
    let children = el.childNodes.length
        ? toArray(el.childNodes).map(v => parse(v))
        : [];

    let vdom = { tagName, attrs, children }

    Object.keys(directives).forEach(key => {
        if (!attrs[key]) return;

        let apply = directives[key];
        let expr = attrs[key];
        delete vdom.attrs[key];
        vdom = apply(expr, vdom);
    });
    return vdom;
}

function needsInterpolation (text) {
    return text.match(/{{(.*?)}}/g);
}

function interpolate (text) {
    const interpolation = text.split(/({{.*?}})/)
        .filter(v => v.length)
        .map(v => {
            if (v.match(/{{(.*?)}}/g)) {
                return v.replace(/{{\s*(.*?)\s*}}/g, '$1');
            }
            return `"${v}"`;
        })
        .join(' + ');
    return new Function(`return ${interpolation};`)
}

const directives = {
    'i-for' (expr, vdom) {
        return new Function(`
            return ${expr} ? ${ serialize(vdom) } : null;
        `);
    },
    'i-for' (expr, vdom) {
        let matches = expr.match(/(.+) of (.+)/);
        let target = matches[2].trim();
        let localVar = matches[1].trim();

        return new Function(`
            return ${target}.map(function (${localVar}) {
                return ${ serialize(vdom) };
            });
        `);
    },
};
