import { templates } from 'components';

const toArray = v => [].slice.call(v);

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

