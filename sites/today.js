import controllerLoader from "tm_modules/today/ads/ad-controller";
import entrypageLoader from "tm_modules/today/ads/entrypage-placements";
import specialpageLoader from "tm_modules/today/ads/specialpage-placements";
import coverpageLoader from "tm_modules/today/ads/cover-front-placements";
import canonicpageLoader from "tm_modules/today/ads/canonic-recipe-placements";

var  ctlInstance = controllerLoader();
ctlInstance.success = function(AdController) {
  var ads = new AdController();
};

var  entryPageInstance = entrypageLoader();
entryPageInstance.success = function(AdPlacements) {
  var ads = new AdPlacements();
};

var  specialPageInstance = specialpageLoader();
specialPageInstance.success = function(AdPlacements) {
  var ads = new AdPlacements();
};

var  coverPageInstance = coverpageLoader();
coverPageInstance.success = function(AdPlacements) {
  var ads = new AdPlacements();
};

var  canPageInstance = canonicpageLoader();
canPageInstance.success = function(AdPlacements) {
  var ads = new AdPlacements();
};

