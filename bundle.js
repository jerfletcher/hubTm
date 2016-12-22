const path = require('path');
const webpack = require("webpack");

var options = {
  "site": 'today',
  "minify": true
};

var plugins = [];
var isDev = false;

process.argv.forEach(function (val, index, array) {
  const splitted = val.split('/');
  if ((splitted[splitted.length - 1] === 'bundle') && (typeof process.argv[index + 1] !== "undefined")) {
    options.site = process.argv[index + 1];
  }

  if (val === '-dev') {
    isDev = true;
    options.minify = false;
  }

});

if (options.minify) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      mangle: {
        //props: true
        //toplevel: true
      }
    })
  );
}

const filename =  options.site + '_bundle' + (options.minify?'_min':'') + '.js';

const wpConfig = {
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
  module: {
    loaders: [{
      test: /\.css$/,
      loader: "css-loader"
    },{
      test: /\.html/,
      loader: "html-loader"
    }, {
      test: /\.jpg$/,
      loader: "file-loader"
    }]
  },
  "plugins": plugins
}


var compiler = webpack(wpConfig);

compiler.run(function(err, stats) {
  if (isDev) {
    console.log(stats);
  }
});

/**
 We could also do

compiler.watch({ // watch options:
  aggregateTimeout: 300, // wait so long for more changes
  poll: true // use polling instead of native watchers
  // pass a number to set the polling interval
}, function(err, stats) {
  // ...
});


 */