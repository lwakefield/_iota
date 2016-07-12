import { expect } from 'chai';
import loader from '~/loader';

describe('Loader', () => {
    let res = loader(`
    <h1> Hello world </h1>
    <h2> Foo </h2>
    <input type="text">
    <style scoped>
        h1 { font-size: 48px; }
    </style>
    <script>
        export default class Foo extends Component {
            data() { return {foo: 'foo'} }
        }
    </script>
    `);
    expect(res).to.eql(
`export default class Foo extends Component {
    data() {
        return { foo: 'foo' };
    }
    render() {
        return <div class='2a5ecb34'><h1> Hello world </h1><h2> Foo </h2><input type='text'/></div>;
    }
}`)
});
