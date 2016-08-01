import { expect } from 'chai';
import Iota from '~/iota';

describe('Iota', () => {
    it('Works', () => {
        document.body.innerHTML = `
        <div>
            <p i-for="m of messages"> {{ m }} </p>
        </div>
        `;

        let el = document.querySelector('div')

        let iota = new Iota({
            el: el,
            data: {
                messages: [ 'one', 'two', 'three' ]
            }
        });

        expect(el.outerHTML).to.be.eql(
            '<div><p> one </p><p> two </p><p> three </p></div>'
        )
    });
});


