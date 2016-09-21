/* eslint-env mocha */
import {
    expect
} from 'chai';
import serialize from '../src/serialize';
import parse from '../src/parse';
import { ComponentTemplate, templates } from '../src/components';

describe('parse', () => {
    before(() => {
        global.Text = window.Text;
    });

    it('parses simple', () => {
        document.body.innerHTML = `
            <div><input type="text"><p>hello</p></div>
        `;
        let [vdom] = parse(document.querySelector('div'));
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
        let [vdom] = parse(document.body);
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
        document.body.innerHTML = '<p>hello {{ user.name }}</p>';
        let [vdom] = parse(document.querySelector('p'));
        compare(vdom, {
            tagName: 'p',
            attrs: {},
            events: [],
            children: [
                function anonymous () {
                    return "hello " + user.name;
                }
            ]
        });
    });

    it('parses i-for', () => {
        document.body.innerHTML = `
            <div><div i-for="m of messages">message: {{ m.text }}</div></div>
        `;
        let [vdom] = parse(document.body.querySelector('div'));
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
        let [vdom] = parse(document.body.querySelector('div'));
        compare(vdom.events, [{
            type: 'click',
            listener: function anonymous($event
                /**/
            ) {
                return console.log($event);
            }
        }]);
    });

    it('parses i-model', () => {
        document.body.innerHTML = `<input type="text" i-model="user.name">`;
        let [vdom] = parse(document.querySelector('input'));
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

    it('parses component', () => {
        document.body.innerHTML = `
            <template id="my-component">
                <section>
                    <button @click="increment()">+1</button>
                    <p>{{ counter }}</p>
                </section>
            </template>

            <p>Hello world</p>
            <my-component :foo="one" :bar="two"></my-component>
        `;
        templates['my-component'] = new ComponentTemplate('my-component', {
            data () { return { counter: 0 }; },
            el: '#my-component',
            props: ['foo', 'bar'],
            methods: {
                increment () { this.counter++; }
            }
        });

        let [vdom, pool] = parse(document.body);
        expect(vdom.children.length).to.eql(2);
        const p = vdom.children[0];
        expect(p.tagName).to.eql('p');
        const myComp = vdom.children[1];
        expect(myComp.tagName).to.eql('my-component');
        expect(myComp.isComponent).to.eql(true);
        expect(myComp.uid).to.eql('my-component.0');
        expect(myComp.props).to.be.instanceof(Function);
        expect(pool.instances).to.eql({
            'my-component': [
                {length: 0}
            ]
        });
    });

    // it('parses component with i-for', () => {
    //     document.body.innerHTML = `
    //         <template id="my-component">
    //             <section>
    //                 <button @click="increment()">+1</button>
    //                 <p>{{ counter }}</p>
    //             </section>
    //         </template>

    //         <my-component i-for="i in counters"></my-component>
    //     `;
    //     templates['my-component'] = new ComponentTemplate('my-component', {
    //         data () { return { counter: 0 }; },
    //         el: '#my-component',
    //         methods: { increment () { this.counter++; } }
    //     });
    // });
});

function compare (a, b) {
    expect(serializeAndNormalize(a)).to.be.eql(serializeAndNormalize(b));
}

function serializeAndNormalize (obj) {
    return serialize(obj)
        .split('\n')
        .map(v => v.trim())
        .join('');
}

