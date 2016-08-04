import { expect } from 'chai';
import serialize from '../src/serialize';
import { parse } from '../src/parse';
import { preRender, render, preProcess } from '../src/render';
import h from '../src/h';

import { jsdom } from 'jsdom';

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

