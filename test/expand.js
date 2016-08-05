import { expect } from 'chai';
import serialize from '../src/serialize';
import parse from '../src/vdom/parse';
import expand from '../src/vdom/expand';
import h from '../src/h';

import { jsdom } from 'jsdom';

describe('process', () => {
    it ('flattens arrays', () => {
        let messages = [
            {text: 'one'},
            {text: 'two'},
            {text: 'three'}
        ]
        let vdom = h('div', {}, [
            () => messages.map(m => {
                return {
                    tagName: 'p',
                    attrs: {},
                    children: [m.text]
                };
            })
        ]);
        expect(expand(vdom)).to.eql(
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
        let user = {
            firstName: 'Fred',
            lastName: 'Doe'
        };
        let messages = [
            {text: 'one'},
            {text: 'two'},
            {text: 'three'}
        ]
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
        expect(expand(vdom)).to.eql({
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

