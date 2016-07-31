import { expect } from 'chai';
import serialize from '~/serialize';

describe('serialize', () => {
    it ('works on a basic obj', () => {
        expect(serialize({foo: 'hello'})).to.eql(
`{
  foo: 'hello'
}`
        );
    });

    it ('works on mixed obj', () => {
        expect(serialize({foo: 'hello', bar: 123, baz: 1.23})).to.eql(
`{
  foo: 'hello',
  bar: 123,
  baz: 1.23
}`
        );
    });

    it ('works on nested obj', () => {
        let obj = {
            foo: {
                bar: {
                    baz: 'hello'
                }
            }
        };
        expect(serialize(obj)).to.eql(
`{
  foo: {
    bar: {
      baz: 'hello'
    }
  }
}`
        );
    });

    it('works on an obj with a function', () => {
        let obj = {
            foo: function () { console.log('hello world!'); },
            bar: 'hello'
        };
        // Function.toString seems to butcher indentation
        expect(serialize(obj)).to.eql(
`{
  foo: function foo() {
                console.log('hello world!');
            },
  bar: 'hello'
}`
        );
    });

    it('works on an arr', () => {
        let arr = ['one', 'two', 'three'];
        expect(serialize(arr)).to.eql(
`[
  'one',
  'two',
  'three'
]`
        )
    });

    it('works on an arr of objs', () => {
        let arr = [
            { foo: 'one' },
            { foo: 'two' },
            { foo: 'three' }
        ];
        expect(serialize(arr)).to.eql(
`[
  {
    foo: 'one'
  },
  {
    foo: 'two'
  },
  {
    foo: 'three'
  }
]`
        );
    });

    it('works on an empty obj', () => {
        expect(serialize({})).to.eql('{}')
    })

    it('works on an empty arr', () => {
        expect(serialize([])).to.eql(`[]`)
    })
});

