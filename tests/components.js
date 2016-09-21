/* eslint-env mocha */
import { expect } from 'chai';
import {
    templates,
    isComponent,
    ComponentTemplate,
    ComponentPool,
    registerComponent
} from 'components';

global['Text'] = window.Text;

function injectBasicComponent () {
    document.body.innerHTML = `
        <template id="my-component">
            <h1>{{ msg }}</h1>
        </template>
    `;
}

describe('isComponent', () => {
    const el = document.createElement('my-component');
    it('returns false correctly', () => {
        expect(isComponent(el)).to.eql(false);
    });
    it('returns true correctly', () => {
        templates['my-component'] = {};
        expect(isComponent(el)).to.eql(true);
    });
});

describe('registerComponent', () => {
    beforeEach(injectBasicComponent);
    it('correctly registers components', () => {
        const el = '#my-component';
        const data = () => ({msg: 'hello world'});
        registerComponent('my-component', {el, data});
        expect(templates['my-component']).is.not.undefined;
    });
});

describe('ComponentTemplate', () => {
    describe('instantiation', () => {
        it('instantiates with an el', () => {
            injectBasicComponent();
            const el = document.querySelector('#my-component');
            const template = new ComponentTemplate('my-component', {el});
            expect(template).to.not.be.undefined;
            expect(template.name).to.eql('my-component');
            expect(template.options.el).is.not.undefined;
            expect(template.options.vdom).is.not.undefined;
            expect(template.options.pool).is.not.undefined;
        });
        it('instantiates with an selector', () => {
            injectBasicComponent();
            const el = '#my-component';
            const template = new ComponentTemplate('my-component', {el});
            expect(template).is.not.undefined;
            expect(template.name).to.eql('my-component');
            expect(template.options.el).is.not.undefined;
            expect(template.options.vdom).is.not.undefined;
            expect(template.options.pool).is.not.undefined;
        });
        it('instantiates and wraps when there are multiple els', () => {
            document.body.innerHTML = `
                <template id="my-component">
                    <h1>{{ msg }}</h1>
                    <h2>{{ msg }}</h2>
                </template>
            `;
            const el = '#my-component';
            const template = new ComponentTemplate('my-component', {el});
            expect(template).is.not.undefined;
            expect(template.name).to.eql('my-component');
            expect(template.options.el).is.not.undefined;
            expect(template.options.vdom).is.not.undefined;
            expect(template.options.vdom.tagName).to.eql('div');
            expect(template.options.pool).is.not.undefined;
        });
    });
    it('creates a new instance', () => {
        const el = '#my-component';
        const options = {
            el,
            data () {
                return {msg: 'hello world'};
            }
        };
        const template = new ComponentTemplate('my-component', options);
        const instance = template.newInstance();
        expect(instance).is.not.undefined;
    });
});

describe('ComponentPool', () => {
    let pool;
    beforeEach(() => {
        pool = new ComponentPool();
        injectBasicComponent();
    });

    it('registers components', () => {
        const uid = pool.register('my-component');
        const [name, id] = uid.split('.');
        expect(uid).to.eql('my-component.0');
        expect(pool.instances[name][id]).to.eql({length: 0});
    });

    it('instantiates a component without a key', () => {
        const uid = pool.register('my-component');
        const [name, id] = uid.split('.');
        const inst = pool.instantiate(uid);
        expect(inst).is.not.undefined;
        const group = pool.instances[name][id];
        expect(group.length).to.eql(1);
        expect(group[0]).is.not.undefined;
    });
    it('gets a component by key', () => {
        const uid = pool.register('my-component');
        pool.instantiate(uid);
        const inst = pool.get(uid, 0);
        expect(inst).is.not.undefined;
    });
    it('instantiates two components without keys', () => {
        const uid = pool.register('my-component');
        const [name, id] = uid.split('.');

        const inst1 = pool.instantiate(uid);
        const inst2 = pool.instantiate(uid);
        expect(inst1).is.not.undefined;
        expect(inst2).is.not.undefined;

        const group = pool.instances[name][id];
        expect(group.length).to.eql(2);
        expect(group[0]).is.not.undefined;
        expect(group[1]).is.not.undefined;
    });
    it('instantiates a component with a key', () => {
        const uid = pool.register('my-component');
        const [name, id] = uid.split('.');
        const inst = pool.instantiate(uid, 'foo');
        expect(inst).is.not.undefined;
        const group = pool.instances[name][id];
        expect(group.length).to.eql(1);
        expect(group['foo']).is.not.undefined;
    });
    it('instantiates two components with a key', () => {
        const uid = pool.register('my-component');
        const [name, id] = uid.split('.');
        const inst1 = pool.instantiate(uid, 'foo');
        const inst2 = pool.instantiate(uid, 'bar');
        expect(inst1).is.not.undefined;
        expect(inst2).is.not.undefined;

        const group = pool.instances[name][id];
        expect(group.length).to.eql(2);
        expect(group['foo']).is.not.undefined;
        expect(group['bar']).is.not.undefined;
    });
});
