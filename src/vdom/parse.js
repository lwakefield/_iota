import serialize from '../serialize';
import { isComponent, ComponentPool } from '../components';
import { collectProps } from './component';

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
    const pool = new ComponentPool();
    function _parse (el) {
        if (el.splitText) {
            let text = el.textContent;
            return needsInterpolation(text)
                ? interpolate(text)
                : text.trim();
        }

        let vdom = {
            tagName: el.tagName.toLowerCase(),
            attrs: {},
            events: []
        };

        if (isComponent(el)) {
            vdom.isComponent = true;
            vdom.props = collectProps(el);
            pool.register(vdom);
        } else {
            const allChildren = el.childNodes.length
                ? toArray(el.childNodes).map(v => _parse(v))
                : [];
            vdom.children = allChildren
                .filter(v => !!v)
                .filter(v => !v.tagName || v.tagName.toLowerCase() !== 'template');
        }

        toArray(el.attributes).forEach(v => {
            parseAttr(vdom, v);
        });
        Object.keys(directives).forEach(key => {
            let attr = getDir(el, key);
            if (!attr) return;
            el.removeAttribute(attr.name);
            delete vdom.attrs[attr.name];

            let apply = directives[key];
            vdom = apply(attr, vdom);
        });
        return vdom;
    }

    return [_parse(el), pool];
}

function parseAttr (vdom, attr) {
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
    // eslint-disable-next-line
    return new Function(`return ${interpolation};`);
}

const directives = {
    '^@.+' (attr, vdom) {
        let type = attr.name.replace(/^@/, '');
        // eslint-disable-next-line
        let listener = new Function('$event', `return ${attr.value};`);
        vdom.events.push({ type, listener });
        return vdom;
    },
    '^:.+' (attr, vdom) {
        let name = attr.name.replace(/^:/, '');
        // eslint-disable-next-line
        vdom.attrs[name] = new Function(`return ${attr.value};`);
        return vdom;
    },
    'i-model' (attr, vdom) {
        // i-model is really sugar for:
        //   <input
        //      @change="$set('message', $e.target.value)"
        //      :value="message">
        const field = attr.value;
        vdom.events.push({
            type: 'input',
            listener: new Function('$event', `
                this.${field} = $event.target.value;
            `)
        })
        vdom.attrs['value'] = new Function (`return ${field};`);
        return vdom;
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
