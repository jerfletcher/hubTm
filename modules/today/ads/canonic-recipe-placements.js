import * as utils from 'lib/basicUtils';
/* Mobile / Tablet - shared Canonical Recipe ad placements (Desktop placements can be found in desktop/ads) */

export default function() {
  return utils.runWhenAvailable([
    'mps',
    'jQuery',
    'Backbone',
    'jQuery.waypoints' //jquery version of waypoints
  ], function (mps, jQuery, Backbone, waypoints) {


    var mpsDevice = mps.pagevars && mps.pagevars.cags && mps.pagevars.cags.device;

    var AdPlacements = Backbone.View.extend({
      formFactor: String(mpsDevice || 'mobile'),
      isNotLandscapeTablet: $(window).width() < 910,
      adTrackerRun: false,
      boxAdHeight: 250 + 13, // includes ad label height

      initialize: function () {
        this.manageContainers(); // create all ad containers
        this.loadComponent('.revpanel-belowarticle');
        this.bindAdRenderedCallback(); // performs further adjustments based on rendered ad data
        this.bindAdsRefreshedCallback(); // if slot refreshed does not display at the responsive set size and needs cleanup, cleanup goes here
      },

      manageContainers: function () {
        var self = this,
          skipAd = false,
          allSlots = mps.responsiveslots[mps._loadset];

        for (var adSlotKey in allSlots) {
          if (!$('#j-' + adSlotKey + '-ad').length) {
            self.createAdContainer(adSlotKey);
          }
        }
      },

      createAdContainer: function (adSlotKey) {
        var self = this,
          containerTemplate,
          placement = adSlotKey,
          typeContainsBox = adSlotKey.indexOf('box');

        if (typeContainsBox !== -1) {
          placement = 'box'; // unifying boxflex and box#s for stream placement
        }
        containerTemplate = _.template('<div class="<%= p %>-ad"><div id="j-<%= k %>-ad" class="ad-inner<% if (ll) { %> lazy-load"<% } else { %>"<% } %> data-placement="<%= k %>"></div></div>'); // underscore template for ad containers

        switch (placement) { // where to render each ad by case
          case 'topbanner':
            $('main.content-wrapper').before(containerTemplate({p: placement, k: adSlotKey, ll: false}));
            break;
          case 'box':
            if (self.isNotLandscapeTablet && adSlotKey === 'boxflex') {
              $('.recipe-details-container').after(containerTemplate({p: placement, k: adSlotKey, ll: true}));
            } else if (self.formFactor === 'tablet' && !self.isNotLandscapeTablet && adSlotKey === 'box1') {
              $('.recipe-l-panel').append(containerTemplate({p: placement, k: adSlotKey, ll: true}));
            } else if (adSlotKey === 'boxflex') {
              $('.food-community').after(containerTemplate({p: placement, k: adSlotKey, ll: true}));
            } else if (self.isNotLandscapeTablet && adSlotKey === 'box1') {
              $('.recipe-l-bottom').before(containerTemplate({p: placement, k: adSlotKey, ll: true}));
            }
            break;
        }
      },

      loadComponent: function (element) {
        var componentID = $(element).data('component-name'); // assumes data-component-id attribute on .rev-panel
        if (componentID && $(element).children().length < 1) {
          mps.insertComponent(mps._select(element), componentID);
        }
      },

      loadedAdsTracker: function (slot) { //fires an event when initial adload completes to provide data to third party scripts
        var initialAdsRequested = window.adController.initialAdsRequested,
          allAdsReturned = window.adController.allAdsReturned,
          initialAdloadEvent,
          adSlotsDisabled = mps.slotsdisabled[0],
          allAdsPresent = true;
        allAdsReturned.push(slot);

        initialAdloadEvent = document.createEvent('CustomEvent');

        initialAdloadEvent.initCustomEvent('ad-controller:initial-ads-loaded', false, false, {
          'adData': mps._adloads[0],
          'formFactor': this.formFactor,
          'returnedAds': allAdsReturned,
          'disabledAds': adSlotsDisabled
        });

        if (!this.adTrackerRun) { //fire the event only once per page load
          for (var i = 0; i < initialAdsRequested.length; i++) { //check if all requested ads are either returned or disabled
            if (allAdsReturned.indexOf(initialAdsRequested[i]) === -1 && adSlotsDisabled.indexOf(initialAdsRequested[i]) === -1) {
              allAdsPresent = false; //if all ads present, this stays true
            }
          }
          if (allAdsPresent) {
            this.adTrackerRun = true;
            window.adController.initialAdsRequested = null;
            document.dispatchEvent(initialAdloadEvent);
          }
        }
      },

      bindAdRenderedCallback: function () { // triggers for each ad slot when an ad is returned, allows us to apply certain functionality based on the actual ad content returned
        var self = this;
        mps.adloadCallback = function (adData) {
          var placement = adData._mps._slot,
            slot = adData._mps.adslot,
            id = '#' + adData._mps.adslot,
            isEmpty = adData.isEmpty,
            parentContainer = $(id).parent().parent(),
            noLabel = false, // flag to hide ad label
            showAdChoices = false, // flag to add the extra ad choices icon and text to the ad label
            adHeight;

          self.loadedAdsTracker(placement);

          if (!isEmpty) {
            $(parentContainer).addClass('ad-loaded');
          }

          switch (placement) {
            case 'topbanner': // must load after rails in MPS (DART Ad Units heavier weight)
              adHeight = adData.size[1];
              self.topbannerWidth = adData.size[0]; // making this accessible to rails
              noLabel = true;
              $(id).css({'height': adHeight + 'px'});
              break;
            case 'boxflex':
              adHeight = adData.size[1];
              showAdChoices = true;
              if (adHeight > self.boxAdHeight) { // revised to check if is taller than row-height rather than look for a specific height
                $(parentContainer).addClass('large');
              } else {
                $(parentContainer).removeClass('large');
              }
              break;
          }
          if (!noLabel) {
            $(window).trigger('ad-controller:render-label', [slot, showAdChoices, isEmpty]); // add the label via ad-controller.js
          }
        };
      },

      bindAdsRefreshedCallback: function () {
        var self = this;
        mps.refreshAdsCallback = function (slotvars) {
          var refreshedSlots = mps._adloads['R' + mps._loadset] || [], // makes sure we're getting the refreshed object of the current adloadset, normally 0/R0
            disabledAds = mps.slotsdisabled[mps._loadset]; // disabled ad slots, not refreshed

          var adCleanup = function (placement) {
            var containers = $('div.ad-inner[data-placement="' + placement + '"]');
            $.each(containers, function (index, div) {
              var slotID = $(div).find('.mps-slot').attr('id');

              $(div).parent().removeClass('ad-loaded');
              $(window).trigger('ad-controller:render-label', [slotID, null, true]); // removes the label via ad-controller.js for ANY disabled slot
            });
          };

          $.each(refreshedSlots, function (placement, loads) { // loops through each refreshed slot to check whether or not an ad was returned
            var empty = loads[_.size(loads) - 1].empty; // gets whether the latest ad load happened or not
            if (empty) {
              adCleanup(placement);
            }
          });

          for (var placement in disabledAds) { // disabled ads don't show up in the refreshedSlots object, this takes care of them
            adCleanup(disabledAds[placement]);
          }
        };
      }

    });

    return AdPlacements;
  });

};
