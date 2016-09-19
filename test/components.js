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
    it('correctly registers components', () => {
        // registerComponent('my-component', {});
        // console.log(templates);
    });
});

describe.only('ComponentTemplate', () => {
    document.body.innerHTML = `
        <template id="my-component">
            <h1>{{ msg }}</h1>
        </template>
    `;
    it('instantiates with an el', () => {
        const el = document.querySelector('#my-component');
        const template = new ComponentTemplate('my-component', {el});
        expect(template).to.not.be.undefined;
        expect(template.name).to.eql('my-component');
        expect(template.options.el).to.not.be.undefined;
        expect(template.options.vdom).to.not.be.undefined;
        expect(template.options.pool).to.not.be.undefined;
    });
});

describe('ComponentPool', () => {
    const pool = new ComponentPool();
    it('registers components', () => {
        expect(pool.register('my-component')).to.eql('my-component.0');
    });
});
