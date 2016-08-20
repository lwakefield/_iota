import { templates } from '../components';

const toArray = v => [].slice.call(v);

export function collectComponent (el) {
    const tagName = el.tagName.toLowerCase();
    const template = templates[tagName];

    let inst = {
        isComponent: true,
        isMounted: false,
        tagName,
        events: []
    };

    let props = [];
    toArray(el.attributes).forEach(attr => {
        if (!attr.name.match('^:.+')) return;

        let name = attr.name.replace(/^:/, '');
        if (template.props && template.props.includes(name)) {
            props.push([name, attr.value]);
        }
    });
    const propsStr = '{' +
        props.map(v => v.join(': ')).join(', ') +
        '}';

    // eslint-disable-next-line
    inst.props = new Function(`return ${propsStr};`);

    return inst;
}

