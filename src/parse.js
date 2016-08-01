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
            : text.trim();
    }

    let tagName = el.tagName.toLowerCase();
    let attrs = {};
    let events = {};
    toArray(el.attributes).forEach(v => {
        if (v.name.startsWith('@')) {
            let name = v.name.replace(/^@/, '');
            events[name] = new Function('$event', `return ${v.value};`);
        } else if (v.name.startsWith(':')) {
            let name = v.name.replace(/^:/, '');
            attrs[name] = new Function(`return ${v.value};`);
        } else {
            attrs[v.name] = v.value;
        }
    });
    let children = el.childNodes.length
        ? toArray(el.childNodes).map(v => parse(v))
        : [];
    children = children.filter(v => !!v);

    let vdom = { tagName, attrs, children };
    if (!emptyObj(events)) vdom.events = events;

    Object.keys(directives).forEach(key => {
        if (!attrs[key]) return;

        let apply = directives[key];
        let expr = attrs[key];
        delete vdom.attrs[key];
        vdom = apply(expr, vdom);
    });
    return vdom;
}

const emptyObj = obj => Object.keys(obj).length === 0
    && obj.constructor === Object;

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
