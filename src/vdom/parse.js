import serialize from '../serialize';

const toArray = v => [].slice.call(v);
const isEventAttr = v => v.name.startsWith('@');
const isBindingAttr = v => v.name.startsWith(':');
const elHasDir = (el, dir) => {
    return toArray(el.attributes).findIndex(v => v.name.match(dir)) !== -1;
}
const getDir = (el, dir) => toArray(el.attributes)
    .find(v => v.name.match(dir));

/**
 * This function recursively parses the DOM into a vdom
 * The vdom is made up of Objects and Functions
 * Static elements will be rendered as an Object
 * Interpolated or Directive based elements are rendered as a Function.
 * Calling the Function directly will yield errors. This is because the Function
 *   references properties that are not available in scope.
 */
export default function parse (el) {
    if (el.splitText) {
        let text = el.textContent;
        return needsInterpolation(text)
            ? interpolate(text)
            : text.trim();
    }

    let tagName = el.tagName.toLowerCase();
    let attrs = {};
    let events = {};
    let vdom = {
        tagName: el.tagName.toLowerCase(),
        attrs: {},
        events: [],
        children: []
    }
    toArray(el.attributes).forEach(v => {
        if (isEventAttr(v)) {
            parseEventAttr(vdom, v);
        } else if (isBindingAttr(v)) {
            parseBindingAttr(vdom, v);
        } else {
            parseAttr(vdom, v);
        }
    });
    let children = el.childNodes.length
        ? toArray(el.childNodes).map(v => parse(v))
        : [];
    vdom.children = children.filter(v => !!v);

    Object.keys(directives).forEach(key => {
        // console.log(getDir(el, key));
        // let attr = getDir(el, key);
        // console.log(attr);
        const expr = vdom.attrs[key];
        if (!expr) return;
        delete vdom.attrs[key];

        let apply = directives[key];
        vdom = apply(expr, vdom);
    });
    return vdom;
}

const emptyObj = obj => Object.keys(obj).length === 0
    && obj.constructor === Object;

function parseEventAttr (vdom, attr) {
    let type = attr.name.replace(/^@/, '');
    let listener = new Function('$event', `return ${attr.value};`);
    vdom.events.push({ type, listener });
}

function parseBindingAttr (vdom, attr) {
    let name = attr.name.replace(/^:/, '');
    vdom.attrs[name] = new Function(`return ${attr.value};`);
}

function parseAttr(vdom, attr) {
    vdom.attrs[attr.name] = needsInterpolation(attr.value)
        ? interpolate(attr.value)
        : attr.value;
}

function needsInterpolation (text) {
    return text.match(/{{(.*?)}}/g);
}

function interpolate (text) {
    const interpolation = text.split(/({{.*?}})/)
        .filter(v => v.trim().length)
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
    'i-model' (expr, vdom) {
        // el updates data on 'change' event
        // adds a binding to 'value'
        // <input type="text" i-model="message"> is sugar for:
        //   <input
        //      @change="$set('message', $e.target.value)"
        //      :value="message">
    },
    'i-if' (expr, vdom) {
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
