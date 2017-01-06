import * as basic from 'tm_tools/basicUtils';
import controller from "tm_modules/today/ads/ad-controller";

var dependModules = [
    'mps',
    'jQuery',
    'Backbone',
    'jQuery.waypoints' //jquery version of waypoints
];

basic.runWhenAvailable( dependModules, controller);
