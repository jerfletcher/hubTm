const path = require('path');
const webpack = require('webpack');

var options = {
  "site": process.env.npm_package_config_site,
  "minify": (process.env.npm_package_config_minify === true)
};

console.log('minify ' + process.env.npm_package_config_minify);

var plugins = [];

if (options.minify) {
  console.log('uglify');
    plugins.push(new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        mangle: {
          //props: true
          //toplevel: true
        }
      })
    );
}

var filename =  options.site + '_bundle' + (options.minify?'_min':'') + '.js';

module.exports = {
    context: __dirname,
    entry: "./sites/" + options.site + ".js",
    output: {
        "path": __dirname + '/dist',
        "filename":  filename
    },
    resolve: {
        modules: [
            path.resolve(__dirname)
        ]
    },
  "plugins": plugins
}
