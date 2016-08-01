import { expect } from 'chai';
import serialize from '~/serialize';
import h from '~/h';
import { parse } from '~/parse';

function serializeAndNormalize (obj) {
    return serialize(obj)
        .split('\n')
        .map(v => v.trim())
        .join('');
}

describe('parse', () => {

    it ('parses simple', () => {
        document.body.innerHTML = `
            <div><input type="text"><p>hello</p></div>
        `;
        let vdom = parse(document.querySelector('div'));
        expect(serializeAndNormalize(vdom)).to.be.eql(serializeAndNormalize(
            h('div', {}, [
                h('input', {type: 'text'}, []),
                h('p', {}, ['hello'])
            ])
        ));
    });

    it ('parses with binding', () => {
        document.body.innerHTML = `<p>hello {{ user.name }}</p>`;
        let vdom = parse(document.querySelector('p'));
        expect(serializeAndNormalize(vdom)).to.be.eql(serializeAndNormalize(
            h('p', {}, [
                function anonymous () {
                    return "hello " + user.name;
                }
            ])
        ));
    });

    it ('parses i-for', () => {
        document.body.innerHTML = `
            <div><div i-for="m of messages">message: {{ m.text }}</div></div>
        `;
        let vdom = parse(document.body.querySelector('div'));
        expect(serializeAndNormalize(vdom)).to.be.eql(serializeAndNormalize(
            h('div', {}, [
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
            ])
        ))
    });

    it ('parses @click', () => {
        document.body.innerHTML = `<div @click="console.log($event)"></div>`;
        let vdom = parse(document.body.querySelector('div'));
        expect(serializeAndNormalize(vdom.events)).to.be.eql(serializeAndNormalize(
            {click: function anonymous ($event
            /**/) {
                return console.log($event);
            }}
        ));
    });

    it ('parses :value', () => {
        document.body.innerHTML = `<input type="text" :value="message">`;
        let vdom = parse(document.body.querySelector('input'));
        expect(serializeAndNormalize(vdom.attrs)).to.be.eql(serializeAndNormalize(
            {
                type: 'text',
                value: function anonymous () { return message; }
            }
        ));
    });

});
