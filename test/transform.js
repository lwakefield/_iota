import { expect } from 'chai';
import h from '~/h';
import render from '~/render';
import { For } from '~/transforms';

describe('For', () => {
    let t;
    beforeEach(() => {
		let child = h('p', {'i-for': 'm of messages'}, '{ m }');
		let wrapper = h('div', null, child);
		let el = render(wrapper);
		t = new For(el.querySelector('p'));
    });
    it('Collects left and right terms', () => {
        expect(t.left).to.eql('m');
        expect(t.right).to.eql('messages');
    });
    it('Transforms correctly', () => {
        t.apply();
        expect(t.el.parentNode.innerHTML).to
            .eql('{ messages.map( (m, $index) =&gt; <p>{ m }</p>) }');
    });
});
