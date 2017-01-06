import * as basic from 'tm_tools/basicUtils';
import stuff from "tm_modules/example/stuff/module.js";

var dependModules = [
  'jQuery',
  'something.not.defined'
];

basic.runWhenAvailable( dependModules, stuff);
