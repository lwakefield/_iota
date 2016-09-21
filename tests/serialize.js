/* eslint-env mocha */
import { expect } from 'chai';
import serialize from '../src/serialize';


describe('serialize', () => {
    it('works on a basic obj', () => {
        serializeAndCompare({foo: 'hello'}, `
            {
                foo: 'hello' 
            }
        `);
    });

    it('works on mixed obj', () => {
        serializeAndCompare({foo: 'hello', bar: 123, baz: 1.23}, `
            {
                foo: 'hello',
                bar: 123,
                baz: 1.23
            }
        `);
    });

    it('works on nested obj', () => {
        serializeAndCompare({ foo: { bar: { baz: 'hello' } } }, `
            {
                foo: {
                    bar: {
                    baz: 'hello'
                    }
                }
            }
        `);
    });

    it('works on an obj with a function', () => {
        // Function.toString seems to butcher indentation
        serializeAndCompare({
            foo: function () { console.log('hello world!'); },
            bar: 'hello'
        }, `
            {
                foo: function foo() {
                    console.log('hello world!');
                },
                bar: 'hello'
            }
        `);
    });

    it('works on an arr', () => {
        serializeAndCompare(['one', 'two', 'three'], `
            [
                'one',
                'two',
                'three'
            ]
        `);
    });

    it('works on an arr of objs', () => {
        serializeAndCompare([
            { foo: 'one' },
            { foo: 'two' },
            { foo: 'three' }
        ], `
            [
                {
                    foo: 'one'
                },
                {
                    foo: 'two'
                },
                {
                    foo: 'three'
                }
            ]
        `);
    });

    it('works on an empty obj', () => {
        serializeAndCompare({}, '{}');
    });

    it('works on an empty arr', () => {
        serializeAndCompare([], '[]');
    });

    // This is not possible
    // it('works with variables inside objects', () => {
    //     // eslint-disable-next-line
    //     serializeAndCompare({ foo: bar }, `
    //         foo: bar
    //     `);
    // });
});

function serializeAndCompare (from, to) {
    compare(serialize(from), to);
}

function compare (from, to) {
    const normalize = str => str
        .trim()
        .split('\n')
        .filter(v => !!v.trim())
        .map(v => v.trim())
        .join('\n');

    expect(normalize(from)).to.eql(normalize(to));
}
