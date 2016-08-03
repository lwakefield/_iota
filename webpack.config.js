var path = require('path');

module.exports = {
    devtool: 'source-map',
    entry: './src/index.js',
    output: {
        libraryTarget: 'var',
        library: 'Iota',
        filename: 'iota.js',
        path: path.join(__dirname, './dist'),
        publicPath: '/dist'
    },
    module: {
        loaders: [
            { test: /\.jsx?$/, loader: 'babel'}
        ]
    }
};
