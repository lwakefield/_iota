import {
    expect
} from 'chai';
import serialize from '../src/serialize';
import h from '../src/h';
import parse from '../src/vdom/parse';

function serializeAndNormalize(obj) {
    return serialize(obj)
        .split('\n')
        .map(v => v.trim())
        .join('');
}

function compare(a, b) {
    expect(serializeAndNormalize(a)).to.be.eql(serializeAndNormalize(b));
}

describe('parse', () => {

    it('parses simple', () => {
        document.body.innerHTML = `
            <div><input type="text"><p>hello</p></div>
        `;
        let vdom = parse(document.querySelector('div'));
        compare(vdom, {
            tagName: 'div',
            attrs: {},
            events: [],
            children: [{
                tagName: 'input',
                attrs: {
                    type: 'text'
                },
                events: [],
                children: []
            }, {
                tagName: 'p',
                attrs: {},
                events: [],
                children: ['hello']
            }]
        });
    });

    it('parses multiple children', () => {
        document.body.innerHTML = `
            <ul>
                <li>1</li>
                <li>2</li>
                <li>3</li>
            </ul>
        `;
        let vdom = parse(document.body);
        compare(vdom, {
            tagName: 'body',
            attrs: {},
            events: [],
            children: [{
                tagName: 'ul',
                attrs: {},
                events: [],
                children: [{
                    tagName: 'li',
                    attrs: {},
                    events: [],
                    children: ['1']
                }, {
                    tagName: 'li',
                    attrs: {},
                    events: [],
                    children: ['2']
                }, {
                    tagName: 'li',
                    attrs: {},
                    events: [],
                    children: ['3']
                }]
            }]
        });
    });

    it('parses with interpolation', () => {
        document.body.innerHTML = `<p>hello {{ user.name }}</p>`;
        let vdom = parse(document.querySelector('p'));
        compare(vdom, {
            tagName: 'p',
            attrs: {},
            events: [],
            children: [
                function anonymous() {
                    return "hello " + user.name;
                }
            ]
        });
    });

    it('parses i-for', () => {
        document.body.innerHTML = `
            <div><div i-for="m of messages">message: {{ m.text }}</div></div>
        `;
        let vdom = parse(document.body.querySelector('div'));
        compare(vdom, {
            tagName: 'div',
            attrs: {},
            events: [],
            children: [
                function anonymous() {
                    return messages.map(function(m) {
                        return {
                            tagName: 'div',
                            attrs: {},
                            events: [],
                            children: [function anonymous() {
                                return "message: " + m.text;
                            }]
                        };
                    });
                }
            ]
        });
    });

    it('parses @events', () => {
        document.body.innerHTML = `<div @click="console.log($event)"></div>`
        let vdom = parse(document.body.querySelector('div'));
        compare(vdom.events, [{
            type: 'click',
            listener: function anonymous($event
                /**/
            ) {
                return console.log($event);
            }
        }]);
    });

    it('parses :value', () => {
        document.body.innerHTML = `<input type="text" :value="message">`;
        let vdom = parse(document.body.querySelector('input'));
        compare(vdom.attrs, {
            type: 'text',
            value: function anonymous() {
                return message;
            }
        });
    });

    it('parses i-model', () => {
        document.body.innerHTML = `<input type="text" i-model="user.name">`;
        let vdom = parse(document.querySelector('input'));
        compare(vdom, {
            tagName: 'input',
            attrs: {
                type: 'text',
                value: function anonymous() {
                    return user.name;
                }
            },
            events: [{
                type: 'input',
                listener: function anonymous($event
                /**/ ) {
                    this.user.name = $event.target.value;
                }
            }],
            children: []
        });
    });

});
