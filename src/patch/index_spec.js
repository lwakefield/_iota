/* eslint-env mocha */
import { expect } from 'chai'

import {
    patchComponent,
    patchText,
    patchNode,
    collectComponentGroups,
    cleanChildren,
} from './index'
import {
    ComponentPool,
    registerComponent,
} from 'components'

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

    describe('simple components with props', () => {
        function setup () {
            document.body.innerHTML = `
                <template id="foo">
                    <p>{{ foo }}</p>
                    <p>{{ bar }}</p>
                </template>
            `
            const template = registerComponent('foo', {
                el: '#foo',
                props: ['foo', 'bar']
            })
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
            const {pool, dom, vdom} = setup()
            vdom.props = () => ({foo: 'message one', bar: 'message two'})

            const patchedEl = patchComponent({pool, dom, vdom})
            expect(patchedEl.outerHTML).to.eql(`
                <div>
                    <p>message one</p>
                    <p>message two</p>
                </div>
            `.split('\n').map(v => v.trim()).join(''))
        })

        it('successfully patches with updated props', () => {
            const {pool, dom, vdom} = setup()
            vdom.props = () => ({foo: 'message one', bar: 'message two'})
            const patchedEl = patchComponent({pool, dom, vdom})
            vdom.props = () => ({foo: 'message three', bar: 'message four'})
            const patchedAgainEl = patchComponent({pool, dom: patchedEl, vdom})
            expect(patchedAgainEl.outerHTML).to.eql(`
                <div>
                    <p>message three</p>
                    <p>message four</p>
                </div>
            `.split('\n').map(v => v.trim()).join(''))
        })
    })
})

describe('patchText', () => {
    it('patches a textnode', () => {
        const el = document.createTextNode('foo')
        const text = 'bar'
        const patchedEl = patchText(el, text)
        expect(el.nodeValue).to.eql(text)
        expect(patchedEl.nodeValue).to.eql(text)
    })
    it('patches a non textnode', () => {
        const el = document.createElement('div')
        const text = 'bar'
        const patchedEl = patchText(el, text)
        expect(patchedEl.nodeValue).to.eql(text)
    })
})

describe('patchNode', () => {
    it('replaces a node when needed', () => {
        const el = document.createElement('div')
        const patchedEl = patchNode(el, {tagName: 'p'})
        expect(patchedEl).to.not.eql(el)
        expect(patchedEl.tagName).to.eql('P')
    })
    it('does replaces a node when not needed', () => {
        const el = document.createElement('div')
        const patchedEl = patchNode(el, {tagName: 'div'})
        expect(patchedEl).to.eql(el)
    })
})

describe('collectComponentGroups', () => {
    it('does not collect a single comopnent', () => {
        const children = [{isComponent: true, uid: 'foo.0'}]
        const grouped = collectComponentGroups(children)
        expect(grouped).to.eql(children)
    })
    it('collects two components with the same mount point', () => {
        const children = [
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
        ]
        const grouped = collectComponentGroups(children)
        expect(grouped.length).to.eql(1)
        const group = grouped[0]
        expect(group.length).to.eql(2)
        expect(group[0]).to.eql(children[0])
        expect(group[1]).to.eql(children[1])
    })
    it('collects lots of components with the same mount point', () => {
        const children = [
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
        ]
        const grouped = collectComponentGroups(children)
        expect(grouped.length).to.eql(1)
        const group = grouped[0]
        expect(group.length).to.eql(children.length)
        const len = children.length
        for (let i = 0; i < len; i++) {
            expect(group[i]).to.eql(children[i])
        }
    })
    it('does not collect two components with different mount points', () => {
        const children = [
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.1'},
        ]
        const grouped = collectComponentGroups(children)
        expect(grouped).to.eql(children)
    })
    it('terminates when group when mount point changes', () => {
        const children = [
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
            {},
        ]
        const grouped = collectComponentGroups(children)
        expect(grouped.length).to.eql(2)
    })
})

describe('cleanChildren', () => {
    it('removes all children after', () => {
        document.body.innerHTML = `
            <p></p>
            <p></p>
            <p></p>
            <p class="start"></p>
            <p></p>
            <p></p>
        `
        cleanChildren(document.querySelector('.start'))
        const html = document.body.innerHTML
            .split('\n')
            .map(v => v.trim())
            .join('')
        expect(html).to.eql('<p></p><p></p><p></p>')
    })
})
