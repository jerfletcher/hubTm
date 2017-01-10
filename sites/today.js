import controllerLoader from "modules/today/ads/ad-controller";
import entrypageLoader from "modules/today/ads/entrypage-placements";
import specialpageLoader from "modules/today/ads/specialpage-placements";
import coverpageLoader from "modules/today/ads/cover-front-placements";
import canonicpageLoader from "modules/today/ads/canonic-recipe-placements";

var  ctlInstance = controllerLoader();
ctlInstance.success = function(AdController) {
  new AdController();
};

var  entryPageInstance = entrypageLoader();
entryPageInstance.success = function(AdPlacements) {
  new AdPlacements();
};

var  specialPageInstance = specialpageLoader();
specialPageInstance.success = function(AdPlacements) {
  new AdPlacements();
};

var  coverPageInstance = coverpageLoader();
coverPageInstance.success = function(AdPlacements) {
  new AdPlacements();
};

var  canPageInstance = canonicpageLoader();
canPageInstance.success = function(AdPlacements) {
  new AdPlacements();
};

