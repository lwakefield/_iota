import { expect } from 'chai';
import serialize from '../src/serialize';
import { parse } from '../src/parse';
import { preRender, render, preProcess } from '../src/render';
import h from '../src/h';

import { jsdom } from 'jsdom';

describe('preRender', () => {
    it ('renders a simple p element', () => {
        let render = preRender(
            h('p', {}, ['hello'])
        );
        expect(render().outerHTML).to.be.eql('<p>hello</p>');
    });

    it ('renders an el with data', () => {
        let data = {msg: 'hello'};
        let render = preRender(
            h('p', {}, [() => msg ]),
            data
        );
        let res = render();
        expect(res.outerHTML).to.be.eql('<p>hello</p>')
    });

    it ('renders an el with changing data', () => {
        let data = {msg: 'hello'};
        let render = preRender(
            h('p', {}, [() => msg ]),
            data
        );
        expect(render().outerHTML).to.be.eql('<p>hello</p>')
        data.msg = 'world';
        expect(render().outerHTML).to.be.eql('<p>world</p>')
    });

    it ('renders complex', () => {
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
        ]);
        let render = preRender(vdom, data);
        expect(render().outerHTML).to.eql(`
            <div>
                <h1>Hello World!</h1>
                <p>Fred - Doe</p>
                <input type="text">
                <p>one</p>
                <p>two</p>
                <p>three</p>
            </div>
        `.split('\n').map(v => v.trim()).join(''));
    });

    it ('renders with an event listener', (done) => {
        // This is a nightmare passing around fucky scope
        // preRender does the magic scoping
        // we pass in the done callback, which gets evalutated
        // Funnily enough this also confirms scope gets passed in correctly

        let data = {ddddone: done};
        let render = preRender(
            {tagName: 'p', attrs: {}, children: ['hello'], events: {
                'click': function anonymous ($event) {
                    ddddone();
                }
            }},
            data
        );
        let res = render();
        let ev = new window.Event('');
        ev.initEvent('click', null, null);
        res.dispatchEvent(ev);
    });
});

describe('render', () => {
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
})

describe('process', () => {
    it ('flattens arrays', () => {
        let data = {
            messages: [
                {text: 'one'},
                {text: 'two'},
                {text: 'three'}
            ]
        };
        let vdom = h('div', {}, [
            () => messages.map(m => {
                return {
                    tagName: 'p',
                    attrs: {},
                    children: [m.text]
                };
            })
        ]);
        let process = preProcess(vdom, data);
        expect(process()).to.eql(
            {
                "tagName": "div", "attrs": {}, "children": [
                    { "tagName": "p", "attrs": {}, "children": [ "one" ], "events": {} },
                    { "tagName": "p", "attrs": {}, "children": [ "two" ], "events": {} },
                    { "tagName": "p", "attrs": {}, "children": [ "three" ], "events": {} }
                ],
                "events": {}
            }
        )
    });
    it ('processes complex', () => {
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
        ]);
        let process = preProcess(vdom, data);
        expect(process()).to.eql({
            "tagName": "div", "attrs": {}, "children": [
                { "tagName": "h1", "attrs": {}, "children": [ "Hello World!" ], "events": {} },
                { "tagName": "p", "attrs": {}, "children": [ "Fred", " - ", "Doe" ], "events": {} },
                { "tagName": "input", "attrs": { "type": "text" }, "children": [], "events": {} },
                { "tagName": "p", "attrs": {}, "children": [ "one" ], "events": {} },
                { "tagName": "p", "attrs": {}, "children": [ "two" ], "events": {} },
                { "tagName": "p", "attrs": {}, "children": [ "three" ], "events": {} }

            ],
            "events": {}
        });

    });
});

