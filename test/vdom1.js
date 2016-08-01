import { expect } from 'chai';
import parse from '../src/vdom1';

describe('vdom1', () => {
    it('Parses a simple node', () => {
        document.body.innerHTML = `<p> Hello World </p>`;

        expect(parse(document.body)).to.eql(
            [{"tagName":"p","attrs":{},"children":[[" Hello World "]]}]
        )
    });

    it('Parses a bindings', () => {
        document.body.innerHTML = `<p> {{ user.name }} </p>`;

        console.log(JSON.stringify(parse(document.body)));
        // expect(parse(document.body)).to.eql(
        //     [{"tagName":"p","attrs":{},"children":[" Hello World "]}]
        // )
    });
});

