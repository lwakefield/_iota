import { expect } from 'chai';
import Iota from '../src/iota';

describe('Iota', () => {
    it('Works', done => {
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

        iota.$nextTick(() => {
            expect(el.outerHTML).to.be.eql(
                '<div><p>one</p><p>two</p><p>three</p></div>'
            )
            done();
        })
    });

    it('Does attr binding', done => {
        document.body.innerHTML = `
        <div>
            <input type="text" :value="message">
        </div>`;

        let el = document.querySelector('div');

        let iota = new Iota({
            el: el,
            data: {
                message: 'hello world'
            }
        });

        iota.$nextTick(() => {
            expect(el.outerHTML).to.be.eql(
                '<div><input type="text" value="hello world"></div>'
            )
            done();
        });
    });

    it('is reactive', done => {
        document.body.innerHTML = `<p>{{ message }}</p>`;

        let el = document.querySelector('p');

        let iota = new Iota({
            el,
            data: {
                message: 'hello world'
            }
        });

        iota.$nextTick(() => {
            expect(el.outerHTML).to.be.eql('<p>hello world</p>')
            iota.message = 'reacted';
            iota.$nextTick(() => {
                expect(el.outerHTML).to.be.eql('<p>reacted</p>')
                done();
            });
        });
    });
});


