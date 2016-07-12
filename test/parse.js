import { expect } from 'chai';
import { jsdom } from 'jsdom';
import { $toArray } from '~/util';
import { 
    extractParts,
    getRootNode, 
    hash, 
    makeRenderFn,
    closeTags,
    injectRender
} from '~/parse';

describe('Parse', () => {
    it('extracts parts', () => {
        const parts = extractParts(`
            <h1> Hello world </h1>
            <h2> Foo </h2>
            <input type="text">
            <style scoped>
                h1 { font-size: 48px; }
            </style>
            <script>
                class Foo extends Component {

                }
            </script>
        `);
        expect(parts.content.length).to.eql(3);
        expect(parts.styles.length).to.eql(1);
        expect(parts.scripts.length).to.eql(1);
    });
    it('makes the root node', () => {
        let root = makeRootNode($toArray(
            jsdom(`
                <h1> Hello world </h1>
                <h2> Foo </h2>
                <input type="text">
            `).body.childNodes
        ));
        expect(root.outerHTML.trim()).to.eql(`
        <div><h1> Hello world </h1>
                <h2> Foo </h2>
                <input type="text">
            </div>
        `.trim());
    });
    it('adds a hash', () => {
        let el = jsdom(`
            <div>
                <h1> Hello world </h1>
                <h2> Foo </h2>
                <input type="text">
            </div>
        `).body.childNodes[0];
        hash(el);
        expect(el.classList.length).is.eql(1);
    });
    it('makes a render() function', () => {
        let el = jsdom(`
            <div>
                <h1> Hello world </h1>
                <h2> Foo </h2>
                <input type="text">
            </div>
        `).body.childNodes[0];
        let fn = makeRenderFn(el);
        expect(fn.trim()).to.eql(`
    render () {
        return (<div>
                <h1> Hello world </h1>
                <h2> Foo </h2>
                <input type="text">
            </div>);
    }
        `.trim())
    });
    describe('closeTags', () => {
        it('closes input tags', () => {
            expect(closeTags('<input type="text">'))
                .to.eql('<input type="text"/>');
        });
        it('closes multiple tags', () => {
            expect(closeTags(
                `<input type="text">
                <br>`
            ))
            .to.eql(
                `<input type="text"/>
                <br/>`
            )
        });
        it('closes multiple tags in a row', () => {
            expect(closeTags( '<input type="text"><br>'))
                .to.eql('<input type="text"/><br/>');
        });
    });
    it('injectsRender', () => {
        let code = injectRender(`
        export default class Foo extends Component {
            constructor () { super() }
            data () { return { foo: 'one' } }
        }
        `, `
        <div>
            <h1> Hello world </h1>
            <h2> Foo </h2>
            <input type="text"/>
        </div>
        `);
        expect(code).to.eql(`
export default class Foo extends Component {
    constructor() {
        super();
    }
    data() {
        return { foo: 'one' };
    }
    render() {
        return (
            <div>
            <h1> Hello world </h1>
            <h2> Foo </h2>
            <input type='text'/>
        </div>
        );
    }
}
        `.trim());
    });
});

//describe('acorn', () => {
    //let config = {
        //range: false,
        //loc: false,
        //tokens: false,
        //plugins: {jsx: true}
    //};

    //let code = parse(`
    //class Foo extends Bar {
        //constructor () {super();}
        //data () {
            //return {
                //foo: 'bar'
            //};
        //}
    //}
    //`, config);
    //let toInject = parse(`
    //class A {
        //render () {
            //return (
                //<div>
                    //<h1> Hello world </h1>
                    //<h2> Foo </h2>
                    //<input type="text"/>
                //</div>
            //);
        //}
    //}
    //`, config);
    //let renderFn = toInject.body[0].body.body[0];

    //let fooFn = toInject.body[0].body.body[0];
    //code.body[0].body.body.push(fooFn);
//});

//describe('jsdom', () => {
    //let doc = jsdom('<div><input type="text"></div>', {
        //parsingMode: 'xml'
    //});
    //console.log(doc.body.outerHTML);
//});
