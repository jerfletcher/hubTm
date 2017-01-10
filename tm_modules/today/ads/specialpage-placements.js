import * as utils from 'tm_tools/basicUtils';
/* Desktop / Tablet - Native/Special pages - mobile form factor can be found in app/scripts/mobile/ads/specialpage-placements.js */

export default function() {
  return utils.runWhenAvailable([
    'mps',
    'jQuery',
    'Backbone',
    'jQuery.waypoints' //jquery version of waypoints
  ], function (mps, jQuery, Backbone, waypoints) {


    var AdPlacements = Backbone.View.extend({

      adTrackerRun: false,

      initialize: function () {
        this.manageContainers(false); // create all ad containers
        this.bindAdRenderedCallback(); // performs further adjustments based on rendered ad data
        this.bindAdsRefreshedCallback(); // if slot refreshed does not display at the responsive set size and needs cleanup, cleanup goes here
      },

      manageContainers: function (addWaypoints) { // renders all ad containers, even if no ads being placed at current responsive set size
        var allSlots = mps.responsiveslots[mps._loadset];

        _.each(allSlots, function (slotKey, adSlotKey) {
          if (!$('#j-' + adSlotKey + '-ad').length) {
            this.createAdContainer(adSlotKey); // create each container
            if (addWaypoints) {
              $(window).trigger('ad-controller:add-waypoints', ['#j-' + adSlotKey + '-ad']);
            }
          }
        }, this);
      },

      bindMpsLoadedCallback: function () {
        var self = this;
        mps.initCallback = function () {
          self.manageContainers(true); // deferred because mps._loadset updates more slowly than the containers are created, create all ad containers, attaches listener to entry change event for creating more ad containers
        };
      },

      createAdContainer: function (adSlotKey) {
        var containerTemplate,
          placement = adSlotKey;

        containerTemplate = _.template('<div class="<%= p %>-ad"><div id="j-<%= k %>-ad" class="ad-inner<% if (ll) { %> lazy-load"<% } else { %>"<% } %> data-placement="<%= k %>"></div></div>'); // underscore template for ad containers

        switch (placement) { // where to render each ad by case
          case 'topbanner':
            $('#j-entry-panel').before(containerTemplate({p: placement, k: adSlotKey, ll: false}));
            break;
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
            id = '#' + slot,
            isEmpty = adData.isEmpty,
            parentContainer = $(id).parent().parent(),
            parentEntry = $(parentContainer).closest('.entry'),
            parentEntryID = $(parentEntry).data('id'),
            noLabel = false, // flag to hide ad label
            showAdChoices = false; // flag to add the extra ad choices icon and text to the ad label

          self.loadedAdsTracker(placement);

          if (!isEmpty) {
            $(parentContainer).addClass('ad-loaded');
          }

          switch (placement) {
            case 'topbanner':
              adHeight = adData.size[1];
              showAdChoices = true;
              $(id).css({'height': adHeight + 'px'});
              Tdy.Events.trigger('ads:reposition-sharebar');
              break;
          }

          if (!noLabel) {
            $(window).trigger('ad-controller:render-label', [slot, showAdChoices, isEmpty]); // add the label via ad-controller.js
          }
        };
      },

      bindAdsRefreshedCallback: function () {
        mps.refreshAdsCallback = _.throttle(function (slotvars) { // no mechanism (yet) for discovering which ad triggered this callback, so all clean-up executed on call. Throttles so that multiple callbacks on the same resize don't each trigger it.
          var adCleanup = function (placement) {
            var containers = $('div.ad-inner[data-placement="' + placement + '"]');

            $.each(containers, function (index, div) {
              var slotID = $(div).find('.mps-slot').attr('id');

              $(div).parent().removeClass('ad-loaded'); // used for items where CSS needs to be applied ONLY when ads are returned
              $(window).trigger('ad-controller:render-label', [slotID, null, true]); // removes the label via ad-controller.js for ANY disabled slot
            });
          };

          $.each(mps._adloads, function (key, refreshedSlots) { // loops through each refreshed set of ads to see whether any returned empty
            if (key.substring(0, 1) === 'R') {
              $.each(mps._adloads[key], function (placement, loads) { // loops through each refreshed slot to check whether or not an ad was returned
                var empty = loads[_.size(loads) - 1].empty; // gets whether the latest ad load happened or not
                if (empty) {
                  adCleanup(placement);
                }
              });
            }
          });

          $.each(mps.slotsdisabled, function (key, disabledSlots) { // loops through each disabled set of ads
            var disabledSet = mps.slotsdisabled[key];
            $.each(disabledSet, function (placement) { // disabled ads don't show up in the refreshedSlots object, this takes care of them
              adCleanup(disabledSet[placement]);
            });
          });

        }, 500);
      }

    });

    return AdPlacements;
  });
};
