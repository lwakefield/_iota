/* eslint-env mocha */
import { expect } from 'chai'

import patch, {
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
import {
    ComponentGroup
} from 'vdom/util'
import parse from 'parse'

global['Text'] = window.Text

/**
 * When unit testing, we want to make the input and output as obvious as
 * possible.
 * We also want to abstract away everything that is not immediately relevant to
 * the test. By abstracting away everything that is not immediately relevant, we
 * make the test easier to read AND easier to write.
 *
 * Is it okay to rely on other parts of the system? For example, we are testing
 * patching here. Is it okay to use `parse` in order to abstract away the
 * generation of the vdom?
 */

function compareHTML (left, right) {
    const normalize = v => v.split('\n').map(v => v.trim()).join('')
    expect(normalize(left)).to.eql(normalize(right))
}

describe('patchComponent', () => {
    describe('simple static components', () => {
        function setup () {
            document.body.innerHTML = `
                <template id="foo">
                    <p>Hello world</p>
                </template>
                <foo></foo>
            `
            registerComponent('foo', {el: '#foo'})
            const el = document.querySelector('foo')
            const [vdom, pool] = parse(el)
            const uid = 'foo.0'
            const dom = el
            return { pool, uid, dom, vdom }
        }

        it('successfully patches for the first time', () => {
            const {pool, uid, dom, vdom} = setup()
            const [name, key] = uid.split('.')
            // This expectation belongs in the unit testing of the parser
            // expect(pool.instances[name]).to.eql([{length: 0}])

            const patchedEl = patchComponent(pool, dom, vdom)
            compareHTML(patchedEl.outerHTML, '<p>Hello world</p>')
            expect(pool.instances[name][key].length).to.eql(1)
        })

        it('successfully patches twice', () => {
            const {pool, uid, dom, vdom} = setup()
            const [name, key] = uid.split('.')

            const patchedEl = patchComponent(pool, dom, vdom)
            const patchedAgainEl = patchComponent(pool, patchedEl, vdom)

            compareHTML(patchedAgainEl.outerHTML, '<p>Hello world</p>')
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
                <foo :foo="" :bar=""></foo>
            `
            registerComponent('foo', {
                el: '#foo',
                props: ['foo', 'bar'],
            })
            const el = document.querySelector('foo')
            const [vdom, pool] = parse(el)
            const uid = 'foo.0'
            const dom = el
            return { pool, uid, dom, vdom }
        }

        it('successfully patches for the first time', () => {
            const {pool, dom, vdom} = setup()
            // We inject our mocked props
            vdom.props = () => ({foo: 'message one', bar: 'message two'})

            const patchedEl = patchComponent(pool, dom, vdom)
            compareHTML(patchedEl.outerHTML, `
                <div>
                    <p>message one</p>
                    <p>message two</p>
                </div>
            `)
        })

        it('successfully patches with updated props', () => {
            const {pool, dom, vdom} = setup()

            vdom.props = () => ({foo: 'message one', bar: 'message two'})
            const patchedEl = patchComponent(pool, dom, vdom)

            vdom.props = () => ({foo: 'message three', bar: 'message four'})
            const patchedAgainEl = patchComponent(pool, patchedEl, vdom)

            compareHTML(patchedAgainEl.outerHTML, `
                <div>
                    <p>message three</p>
                    <p>message four</p>
                </div>
            `)
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
    function makeGroup (els) {
        const group = new ComponentGroup()
        for (let el of els) {
            group.push(el)
        }
        return group
    }

    it('does collect a single component', () => {
        const children = [{isComponent: true, uid: 'foo.0'}]
        const grouped = collectComponentGroups(children)
        const expected = [makeGroup(children)]
        expect(grouped).to.eql(expected)
    })
    it('collects two components with the same mount point', () => {
        const children = [
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
        ]
        const grouped = collectComponentGroups(children)
        expect(grouped.length).to.eql(1)
        const expected = [ makeGroup(children) ]
        expect(grouped).to.eql(expected)
        expect(grouped[0].length).to.eql(2)
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
        const expected = [ makeGroup(children) ]
        expect(grouped).to.eql(expected)
    })
    it('does not collect two components with different mount points', () => {
        const children = [
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.1'},
        ]
        const grouped = collectComponentGroups(children)
        const expected = [
            makeGroup([children[0]]),
            makeGroup([children[1]]),
        ]
        expect(grouped).to.eql(expected)
    })
    it('terminates when group when mount point changes', () => {
        const children = [
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.0'},
            {isComponent: true, uid: 'foo.1'},
        ]
        const grouped = collectComponentGroups(children)
        const expected = [
            makeGroup([children[0], children[1], children[2]]),
            makeGroup([children[3]]),
        ]
        expect(grouped).to.eql(expected)
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

/**
 * Hackily get the vdom by setting innerHTML then resetting it once we are
 * done.
 */
function getVdom (html) {
    const before = document.body.innerHTML
    document.body.innerHTML = html
    const [vdom, pool] = parse(document.body)
    document.body.innerHTML = before
    return {
        vdom: vdom.children[0],
        pool,
    }
}

function setupComponents (components) {
    const before = document.body.innerHTML
    const componentNames = Object.keys(components)
    componentNames.forEach(v => {
        document.body.innerHTML = components[v]
        registerComponent(v, {el: `#${v}`})
    })
    document.body.innerHTML = before
}

describe('patch', () => {
    describe('static vdom tree with no components', () => {
        const html = `
            <div id="my-app">
                <h1>Hello world</h1>
                <ul class="foo bar">
                    <li>one</li>
                    <li>two</li>
                    <li>three</li>
                </ul>
            </div>
        `
        const {vdom} = getVdom(html)

        it('successfully patches a matching root el', () => {
            document.body.innerHTML = '<div></div>'
            const el = document.querySelector('div')
            const patchedEl = patch(null, null, el, vdom)

            compareHTML(patchedEl.outerHTML, html)
        })

        it('successfully patches a non matching root el', () => {
            document.body.innerHTML = '<p></p>'
            const el = document.querySelector('p')
            const patchedEl = patch(null, null, el, vdom)

            compareHTML(patchedEl.outerHTML, html)
        })
    })

    describe('successfully patches static vdom tree with components', () => {
        const html = `
            <div id="my-app">
                <h1>Hello world</h1>
                <section>
                    <foo></foo>
                    <hr>
                    <bar></bar>
                </section>
            </div>
        `
        const components = {
            bar: `
            <template id="bar">
                <p>Hello world from bar</p>
            </template>`,

            foo: `
            <template id="foo">
                <p>Hello world from foo</p>
            </template>`,
        }

        function setup () {
            setupComponents(components)
            const before = document.body.innerHTML
            document.body.innerHTML = html
            const el = document.querySelector('div')
            const [vdom, pool] = parse(el)
            document.body.innerHTML = before
            return {vdom, pool}
        }

        it('successfully patches', () => {
            const {vdom, pool} = setup()

            document.body.innerHTML = '<div></div>'
            const el = document.querySelector('div')
            const patchedEl = patch(null, pool, el, vdom)
            compareHTML(patchedEl.outerHTML, `
                <div id="my-app">
                    <h1>Hello world</h1>
                    <section>
                        <p>Hello world from foo</p>
                        <hr>
                        <p>Hello world from bar</p>
                    </section>
                </div>
            `)
        })
    })

    describe('successfully patches static vdom tree with nested components',
    () => {
        const html = `
            <div id="my-app">
                <h1>Hello world</h1>
                <foo></foo>
            </div>
        `
        const components = {
            bar: `
            <template id="bar">
                <p>Hello world from bar</p>
            </template>`,

            foo: `
            <template id="foo">
                <p>Foo with a nested Bar</p>
                <bar></bar>
            </template>`,
        }

        function setup () {
            setupComponents(components)
            const before = document.body.innerHTML
            document.body.innerHTML = html
            const el = document.querySelector('div')
            const [vdom, pool] = parse(el)
            document.body.innerHTML = before
            return {vdom, pool}
        }

        it('successfully patches', () => {
            const {vdom, pool} = setup()

            document.body.innerHTML = '<div></div>'
            const el = document.querySelector('div')
            // console.log(vdom);
            const patchedEl = patch(null, pool, el, vdom)
            compareHTML(patchedEl.outerHTML, `
                <div id="my-app">
                    <h1>Hello world</h1>
                    <div>
                        <p>Foo with a nested Bar</p>
                        <p>Hello world from bar</p>
                    </div>
                </div>
            `)
        })
    })
})
