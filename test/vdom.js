import { expect } from 'chai';
import VirtualDom from '~/vdom';

describe('Vdom', () => {
    it('Applies transforms', () => {
        document.body.innerHTML = `
        <div>
            <p i-for="m of messages"> { m }</p>
        </div>
        `

        const vdom = new VirtualDom(document.body);
        vdom.runTransforms();
        expect(vdom.el.innerHTML.trim()).to.eql(`<div>
            { messages.map( (m, $index) =&gt; <p> { m }</p>) }
        </div>`);
    });
    it('Parses correctly', () => {
        document.body.innerHTML = `
        <div>
            <p i-for="m of messages"> { m }</p>
        </div>
        `
        const vdom = new VirtualDom(document.body);
        vdom.runTransforms();
        vdom.parse();


        let parsed = vdom.parsed;

        //expect(parsed.nodeName).to.eql('body');
        //expect(parsed.children[0]).instanceof(String);
        //expect(parsed.children[1].nodeName).to.eql('div');
        //expect(parsed.children[2]).to.eql('#text');
        //expect(parsed.children[1].children[0].nodeName).to.eql('#text');
        //expect(parsed.children[1].children[1].nodeName).to.eql('p');
        //expect(parsed.children[1].children[2].nodeName).to.eql('#text');
    });
});

