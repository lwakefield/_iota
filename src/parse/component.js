import { templates } from 'components';

const toArray = v => [].slice.call(v);

/**
 * Given a DOM node, we collect all attributes that start with a colon assuming
 * that they are props.
 *
 * <my-component :my-prop="propToPass"></my-component>
 *
 * collecting props on the above element will return a function:
 *
 * function anonymous() {
 *     return {
 *         'my-prop': propToPass
 *     }
 * }
 *
 * When calling this anonymous function with the correct scope, gives us a way
 * to evaluate the props and pass them into the component.
 */
export function collectProps (el) {
    const tagName = el.tagName.toLowerCase();
    const template = templates[tagName];

    let props = [];
    toArray(el.attributes).forEach(attr => {
        if (!attr.name.match('^:.+')) return;

        let name = attr.name.replace(/^:/, '');
        if (template.props && template.props.includes(name)) {
            el.removeAttribute(attr.name);
            props.push([name, attr.value]);
        }
    });
    const propsStr = props.length
        ? '{' + props.map(v => v.join(': ')).join(', ') + '}'
        : 'undefined';

    // eslint-disable-next-line
    return new Function(`return ${propsStr};`);
}

