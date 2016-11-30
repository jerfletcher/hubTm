var path = require('path');
var webpack = require('webpack');

module.exports = {
    context: __dirname,
    entry: './sites/today.js',
    output: {
        path: __dirname + '/dist',
        filename: 'today_bundle.js'
    },
    resolve: {
        modules: [
            path.resolve(__dirname)
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            mangle: {
                //props: true
                //toplevel: true
            }
        })
    ]
}
