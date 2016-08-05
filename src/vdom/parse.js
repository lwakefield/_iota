import serialize from '../serialize';

const toArray = v => [].slice.call(v);
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

    let vdom = {
        tagName: el.tagName.toLowerCase(),
        attrs: {},
        events: [],
        children: []
    }
    vdom.children = (
        el.childNodes.length
        ? toArray(el.childNodes).map(v => parse(v))
        : []
    ).filter(v => !!v);

    toArray(el.attributes).forEach(v => {
        parseAttr(vdom, v);
    });
    Object.keys(directives).forEach(key => {
        let attr = getDir(el, key);
        if (!attr) return;
        el.removeAttribute(attr.name)
        delete vdom.attrs[attr.name];

        let apply = directives[key];
        vdom = apply(attr, vdom);
    });
    return vdom;
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
    '^@.+' (attr, vdom) {
        let type = attr.name.replace(/^@/, '');
        let listener = new Function('$event', `return ${attr.value};`);
        vdom.events.push({ type, listener });
        return vdom;
    },
    '^:.+' (attr, vdom) {
        let name = attr.name.replace(/^:/, '');
        vdom.attrs[name] = new Function(`return ${attr.value};`);
        return vdom;
    },
    'i-model' (expr, vdom) {
        // el updates data on 'change' event
        // adds a binding to 'value'
        // <input type="text" i-model="message"> is sugar for:
        //   <input
        //      @change="$set('message', $e.target.value)"
        //      :value="message">
    },
    '^i-if' (attr, vdom) {
        return new Function(`
            return ${attr.value} ? ${ serialize(vdom) } : null;
        `);
    },
    '^i-for$' (attr, vdom) {
        let matches = attr.value.match(/(.+) of (.+)/);
        let target = matches[2].trim();
        let localVar = matches[1].trim();

        return new Function(`
            return ${target}.map(function (${localVar}) {
                return ${ serialize(vdom) };
            });
        `);
    },
};
