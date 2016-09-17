import serialize from '../serialize'

export const directives = {
    '^@.+' (attr, vdom) {
        let type = attr.name.replace(/^@/, '');
        // eslint-disable-next-line
        let listener = new Function('$event', `return ${attr.value};`);
        vdom.events.push({ type, listener });
        return vdom;
    },
    'i-model' (attr, vdom) {
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
export const directiveNames = Object.keys(directives);

