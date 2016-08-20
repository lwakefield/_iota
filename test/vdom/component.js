/* eslint-env mocha */

import { expect } from 'chai';
import { ComponentTemplate, templates } from '../../src/components';
import { collectComponent } from '../../src/vdom/component';

describe('collectComponent', () => {
    before(() => {
        global.Text = window.Text;
        document.body.innerHTML = `
            <template id="my-component">
                <section>
                    <button @click="increment()">+1</button>
                    <p>{{ counter }}</p>
                </section>
            </template>

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
    });

    it('parses props to a function', () => {
        let res = collectComponent(document.querySelector('my-component'));
        expect(res.props).to.be.a('Function');
        compare(res.props.toString(), `
            function anonymous() {
                return {foo: one, bar: two};
            }
        `);
    });
});

function compare (from, to) {
    const normalize = str => str
        .split('\n')
        .map(v => v.trim())
        .filter(v => !!v)
        .join('\n');
    expect(normalize(from)).to.eql(normalize(to));
}
