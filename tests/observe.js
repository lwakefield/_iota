import { expect } from 'chai';
import observe from '../src/observe';

describe('Observe', () => {
    it('Notifies of changes', done => {
        let data = {
            foo: {
                bar: {
                    baz: 'hello'
                }
            }
        };
        data = observe(data, () => {
            done();
        });
        data.foo.bar.baz = 'world';
    });

    it('Refreshes observe if you set prop to an obj', () => {
        let data = {
            foo: {
                bar: 'hello'
            }
        };
        let set = 0;
        data = observe(data, () => set++);

        data.foo = { bar: 'world' };
        expect(set).to.be.eql(1);
        data.foo.bar = 'hello';
        expect(set).to.be.eql(2);
    });

});


