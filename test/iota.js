/* eslint-env mocha */
import { expect } from 'chai';
import Iota from '../src/iota';

describe('Iota', () => {
    before(() => {
        global.Text = window.Text;
    });

    it('Works', () => {
        document.body.innerHTML = `
        <div>
            <p i-for="m of messages"> {{ m }} </p>
        </div>
        `;

        let el = document.querySelector('div');

        // eslint-disable-next-line
        new Iota({
            el: el,
            data: {
                messages: [ 'one', 'two', 'three' ]
            }
        });

        expect(el.outerHTML).to.be.eql(
            '<div><p>one</p><p>two</p><p>three</p></div>'
        );
    });

    it('Does attr binding', () => {
        document.body.innerHTML = '<img src="{{imgSrc}}">';

        let el = document.querySelector('img');

        // eslint-disable-next-line
        new Iota({
            el: el,
            data: {
                imgSrc: '/img.jpg'
            }
        });

        expect(el.outerHTML).to.be.eql(
            '<img src="/img.jpg">'
        );
    });

    it('is reactive', () => {
        document.body.innerHTML = '<p>{{ message }}</p>';

        let el = document.querySelector('p');

        let iota = new Iota({
            el,
            data: {
                message: 'hello world'
            }
        });

        expect(el.outerHTML).to.be.eql('<p>hello world</p>');
        iota.message = 'reacted';
        expect(el.outerHTML).to.be.eql('<p>reacted</p>');
    });
});


