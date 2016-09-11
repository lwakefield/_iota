import serialize from '../serialize';
import { isComponent, ComponentPool } from '../components';
import { collectProps } from './component';

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

        const tagName = el.tagName.toLowerCase();

        let vdom = {
            tagName,
            attrs: {},
            events: []
        };

        if (isComponent(el)) {
            vdom.isComponent = true;
            vdom.props = collectProps(el);
            vdom.uid = pool.register(tagName);
        } else {
            const allChildren = el.childNodes.length
                ? Array.from(el.childNodes).map(v => _parse(v))
                : [];
            vdom.children = allChildren
                .filter(v => !!v)
                .filter(v => !v.tagName || v.tagName.toLowerCase() !== 'template');
        }

        // First round parse of attributes into the vdom
        // Handles static and interpolated attributes
        Array.from(el.attributes).forEach(v => {
            vdom.attrs[v.name] = parseAttr(v);
        });

        // Second round parsing of attributes
        // Handles 'directives'
        directiveNames.forEach(key => {
            const attr = getAttr(el, key);
            if (!attr) return;

            // Remove the attr from the node and the vdom
            // The el should never render
            el.removeAttribute(attr.name);
            delete vdom.attrs[attr.name];

            const apply = directives[key];
            vdom = apply(attr, vdom);
        });

        return vdom;
    }

    return [_parse(el), pool];
}

const getAttr = (el, dir) => Array.from(el.attributes)
    .find(v => v.name.match(dir));

function parseAttr (attr) {
    return needsInterpolation(attr.value)
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
    'i-model' (attr, vdom) {
        // i-model is really sugar for:
        //   <input
        //      @change="$set('message', $e.target.value)"
        //      :value="message">
        const field = attr.value;
        vdom.events.push({
            type: 'input',
            // eslint-disable-next-line
            listener: new Function('$event', `
                this.${field} = $event.target.value;
            `)
        });
        // eslint-disable-next-line
        vdom.attrs['value'] = new Function (`return ${field};`);
        return vdom;
    },
    '^i-if' (attr, vdom) {
        // eslint-disable-next-line
        return new Function(`
            return ${attr.value} ? ${serialize(vdom)} : null;
        `);
    },
    '^i-for$' (attr, vdom) {
        let matches = attr.value.match(/(.+) of (.+)/);
        let target = matches[2].trim();
        let localVar = matches[1].trim();

        // eslint-disable-next-line
        return new Function(`
            return ${target}.map(function (${localVar}) {
                return ${serialize(vdom)};
            });
        `);
    }
};
const directiveNames = Object.keys(directives);
