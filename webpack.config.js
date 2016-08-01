var path = require('path');

module.exports = {
    entry: './index.js',
    output: {
        path: 'dist',
        filename: 'index.js'
    },
    resolveLoader: {
        alias: {
            'iota': path.join(__dirname, './src/loader')
        }
    },
    module: {
        loaders: [
            { test: /\.jsx?$/, loader: 'babel'},
            { test: /\.iota$/, loader: 'iota' }
        ]
    }
};
