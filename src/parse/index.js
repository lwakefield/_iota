import { isComponent, ComponentPool } from 'components';

import { collectProps } from 'parse/component';
import { directives, directiveNames } from 'parse/directives';
import {
    getAttr,
    parseAttr,
    needsInterpolation,
    interpolate
} from 'parse/util';

/**
 * This function recursively parses the DOM into a vdom
 * The vdom is made up of Objects and Functions
 * Static elements will be rendered as an Object
 * Interpolated or Directive based elements are rendered as a Function.
 * Calling the Function directly will yield errors. This is because the Function
 *   references properties that are not available in scope.
 */
export default function parse (el) {
    const pool = new ComponentPool()
    function _parse (el) {
        if (el.splitText) {
            let text = el.textContent
            return needsInterpolation(text)
                ? interpolate(text)
                : text.trim()
        }

        const tagName = el.tagName.toLowerCase()

        let vdom = {
            tagName,
            attrs: {},
            events: [],
        }

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

