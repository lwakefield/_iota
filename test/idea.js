import { expect } from 'chai';
import serialize from '~/serialize';

let data = {
    user: {
        firstName: 'Fred',
        lastName: 'Doe'
    },
    messages: [
        {text: 'one'},
        {text: 'two'},
        {text: 'three'}
    ]
}

function render (vnode) {
    if (vnode.split) {
        let text = interpolate(vnode, data);
        return document.createTextNode(vnode);
    }

    if (vnode instanceof Array) return vnode.map(v => render(v));
    if (vnode instanceof Function) {
        return render(vnode.call({}));
    }

    // This is the "normal" case, where we receive an obj
    let node = document.createElement(vnode.tagName);

    let a = vnode.attrs;
    Object.keys(a).forEach( k => node.setAttribute(k, a[k]) );

    vnode.children.forEach( v => addChildren(node, render(v)));

    return node;
}

function interpolate (text, data) {
    const interpolation = text.replace(/{{(.*?)}}/g, '$${$1}');
    const fn = new Function(...Object.keys(data), 
        'return `' + interpolation + '`;');
    return fn(...Object.values(data));
}

function addChildren (el, children) {
    if (children instanceof Array) {
        children.forEach(v => el.appendChild(v));
        return;
    }
    el.appendChild(children);
}

function h (tagName, attrs={}, children=[]) {
    return { tagName, attrs, children };
}

describe('idea', () => {
    it ('renders single p', () => {
        let res = render(h('p', {}, []));
        expect(res.outerHTML).to.eql('<p></p>');
    });

    it ('renders p with content', () => {
        let res = render(h('p', {}, ['hello world']));
        expect(res.outerHTML).to.eql('<p>hello world</p>');
    });

    it ('renders nested els', () => {
        let vdom = h('div', {}, [
            h('p', {}, ['hello world'])
        ]);
        let res = render(vdom);
        expect(res.outerHTML).to.eql('<div><p>hello world</p></div>');
    });

    it ('renders array of vdom', () => {
        let vdom = [ h('div', {}, []), h('div', {}, []) ];
        let res = render(vdom);
        expect(res[0].outerHTML).to.eql('<div></div>');
        expect(res[1].outerHTML).to.eql('<div></div>');
    });

    it ('renders with a function', () => {
        let vdom = h('ul', {}, [
            () => {
                return [
                    h('li', {}, ['1']),
                    h('li', {}, ['2']),
                    h('li', {}, ['3']),
                ]
            }
        ]);
        let res = render(vdom);
        expect(res.outerHTML).to.eql('<ul><li>1</li><li>2</li><li>3</li></ul>');
    });

    it ('renders with an interpolation', () => {
        let vdom = h('p', {}, [
            '{{ user.firstName }}'
        ]);
        let res = render(vdom);
        expect(res.outerHTML).to.eql('<p>Fred</p>');
    });

    it ('renders and interpolates a function', () => {
        let vdom = h('p', {}, [
            '{{ user.firstName }}'
        ]);
        let res = render(vdom);
        expect(res.outerHTML).to.eql('<p>Fred</p>');
    });
});

function _render (vdom) {
    let str = serialize(vdom);
    let data = {
        user: {
            firstName: 'Fred',
            lastName: 'Doe'
        },
        messages: [
            {text: 'one'},
            {text: 'two'},
            {text: 'three'}
        ]
    };
    let fn = new Function(...Object.keys(data), 'render',
        `return render(${str})`);
    return fn.call(this, ...Object.values(data), render);
}

describe('vdom to fn', () => {
    let vdom = h('div', {}, [
        h('h1', {}, ['Hello World!']),
        h('p', {}, [
            () => user.firstName,
            ' - ',
            () => user.lastName
        ]),
        h('input', {type: 'text'}, []),
        () => messages.map(m => {
            return {
                tagName: 'p',
                attrs: {},
                children: [m.text]
            };
        })
    ])
    it('renders', () => {
        let res = _render(vdom);
        expect(res.outerHTML).to.eql('<div><h1>Hello World!</h1><p>Fred - Doe</p><input type="text"><p>one</p><p>two</p><p>three</p></div>');
    });
});

const toArray = v => [].slice.call(v);

function parse (el) {
    if (el.splitText) {
        let text = el.textContent;
        if (!text.match(/{{(.*?)}}/g)) return text;

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

    let tagName = el.tagName.toLowerCase();
    let attrs = {};
    toArray(el.attributes).forEach(v => {
        attrs[v.name] = v.value;
    });
    let children = el.childNodes.length
        ? toArray(el.childNodes).map(v => parse(v))
        : [];

    let vdom = { tagName, attrs, children }

    Object.keys(directives).forEach(key => {
        if (!attrs[key]) return;

        let apply = directives[key];
        let expr = attrs[key];
        delete vdom.attrs[key];
        vdom = apply(expr, vdom);
    });
    return vdom;
}

const directives = {
    'i-for' (expr, vdom) {
        let matches = expr.match(/(.+) of (.+)/);
        let target = matches[2].trim();
        let localVar = matches[1].trim();

        return new Function(`
            return ${target}.map(function (${localVar}) {
                return ${ serialize(vdom) };
            });
        `);
    }
};

describe('dom to vdom', () => {
    function serializeAndNormalize (obj) {
        return serialize(obj)
            .split('\n')
            .map(v => v.trim())
            .join('');
    }

    it ('transforms simple', () => {
        document.body.innerHTML = `
            <div><input type="text"><p>hello</p></div>
        `;
        let vdom = parse(document.querySelector('div'));
        expect(serializeAndNormalize(vdom)).to.be.eql(serializeAndNormalize(
            { tagName: 'div', attrs: {}, children: [
                {tagName: 'input', attrs: {type: 'text'}, children: []},
                {tagName: 'p', attrs: {}, children: [ 'hello' ]}
            ]}

        ));
    });

    it ('transforms with binding', () => {
        document.body.innerHTML = `<p>hello {{ user.name }}</p>`;
        let vdom = parse(document.querySelector('p'));
        expect(serializeAndNormalize(vdom)).to.be.eql(serializeAndNormalize(
            { tagName: 'p', attrs: {}, children: [
                function anonymous () {
                    return "hello " + user.name;
                }
            ] }
        ));
    })

    it ('transforms i-for', () => {
        document.body.innerHTML = `
            <div><div i-for="m of messages">message: {{ m.text }}</div></div>
        `;
        let vdom = parse(document.body.querySelector('div'));
        expect(serializeAndNormalize(vdom)).to.be.eql(serializeAndNormalize(
            { tagName: 'div', attrs: {}, children: [
                function anonymous () {
                    return messages.map(function (m) {
                        return {
                            tagName: 'div',
                            attrs: {},
                            children: [
                                function anonymous () {
                                    return "message: " + m.text;
                                }
                            ]
                        };
                    })
                }
            ]}
        ))
    })
});
