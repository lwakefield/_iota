/* eslint-env mocha */
import { expect } from 'chai'

import {
    patchComponent,
} from './index'
import {
    ComponentPool,
    registerComponent,
} from 'components'
import parse from 'parse'

global['Text'] = window.Text

describe('patchComponent', () => {
    describe('simple static components', () => {
        function setup () {
            document.body.innerHTML = `
                <template id="foo">
                    <p>Hello world</p>
                </template>
            `
            const template = registerComponent('foo', {el: '#foo'})
            const pool = new ComponentPool()
            const uid = pool.register('foo')
            const dom = document.createElement('foo')
            const vdom = {
                tagName: 'foo',
                attrs: {},
                events: [],
                isComponent: true,
                props: () => ({}),
                uid,
            }
            return {
                template,
                pool,
                uid,
                dom,
                vdom,
            }
        }

        it('successfully patches for the first time', () => {
            const {pool, uid, dom, vdom} = setup()
            const [name, key] = uid.split('.')
            expect(pool.instances[name]).to.eql([{length: 0}])

            const patchedEl = patchComponent({pool, dom, vdom})
            expect(patchedEl.outerHTML).to.eql('<p>Hello world</p>')
            expect(pool.instances[name][key].length).to.eql(1)
        })

        it('successfully patches twice', () => {
            const {pool, uid, dom, vdom} = setup()
            const [name, key] = uid.split('.')
            expect(pool.instances[name]).to.eql([{length: 0}])

            const patchedEl = patchComponent({pool, dom, vdom})
            const patchedAgainEl = patchComponent({pool, dom: patchedEl, vdom})

            expect(patchedAgainEl.outerHTML).to.eql('<p>Hello world</p>')
            expect(pool.instances[name][key].length).to.eql(1)
        })
    })
})
