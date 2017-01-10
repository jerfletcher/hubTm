import * as utils from 'lib/basicUtils';
/* Mobile / Tablet - Articles - other form factors @ app/scripts/desktop/ads/entrypage-placements.js */

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
      pendingContainers: [],
      entryToManage: $('article.entry').first(), // grabs first article until replaced by article to load on MPS init callback (used when fetching more ads)
      boxAdHeight: 250 + 13, // includes ad label height
      betweenAdsHeight: 800,
      adTrackerRun: false,

      initialize: function () {
        this.loadInitialAdsAndRevPanels(); // generates ads for the first entry
        this.bindMpsLoadedCallback(); // triggers ad creation on MPS ready callback
        this.entryLoadEvent(); // watches load-next-entry event and creates ads when triggered
        this.bindAdRenderedCallback(); // performs further adjustments based on rendered ad data
        this.bindAdsRefreshedCallback(); // if slot refreshed does not display at the responsive set size and needs cleanup, cleanup goes here
      },

      loadInitialAdsAndRevPanels: function () { // loads the first entry's ads
        this.manageContainers(this.entryToManage, true); // create all those containers, firstEntry = true - does not reset mpscall data or pending array
      },

      entryLoadEvent: function () { // continuous consumption
        var self = this;
        $(window).one('ad-controller:load-entry-ads', function (e, entryEl) { // runs on ad-specific event fired in Entry.js, separate but similar to load-next-entry
          var mpscallVars = $(entryEl).data('mpscall'); // resets MPScall vars per article when first box-ad is lazy loaded
          for (var mpskey in mpscallVars) { // loop through mpscall vars and set global properties
            mpscall[mpskey] = mpscallVars[mpskey];
          }
          mpscall['cag[entryno]'] = String(parseInt(mpscall['cag[entryno]'], 10) + 1); // increment and convert it back to a string for consistency, entryno not passed via data attribute after the first entry
          mps.makeRequest('more'); // request more ads from MPS
          self.entryToManage = entryEl;
          self.entryLoadEvent();
        });
      },

      manageContainers: function (entryEl, firstEntry) { // renders all ad containers, even if no ads being placed at current responsive set size
        var self = this,
          skipAd = false,
          allSlots = mps.responsiveslots[mps._loadset], // need to switch this to take advantage of newly created MPS function that explicitly passes the weight defined in MPS, in case object property ordering doesn't match
          entryID = $(entryEl).data('id'); // finds the current article by ID, maybe clean up by removing this and passing thisArticle to createAdContainer, and then finding the ID internally?

        for (var adSlotKey in allSlots) { // loops through available ads, is this going to be problematic if called *before* mps.makeRequest('more')? do these ever change from article to article?
          if (( !firstEntry && adSlotKey === 'topbanner' ) || adSlotKey === 'box2' || adSlotKey === 'box3' || adSlotKey === 'box4' || adSlotKey === 'box5') { // don't render topbanner on subsequent articles, or any non boxflex/box1 ads
            skipAd = true;
          } else {
            skipAd = false;
          }
          if (!$('#j-' + adSlotKey + '-' + entryID + '-ad').length && !skipAd) {
            self.createAdContainer(entryID, adSlotKey, true, firstEntry); // create each container, entryID allows us to attach to each article, adSlotKey is the specific ad slot, and true means auto-creation (no measuring to see if the ad fits)
          }
        }
        if (!mpscall['cag[noads]']) {
          self.appendInitialComponents(entryEl, entryID);
        }
      },

      appendInitialComponents: function (entryEl, entryID) {
        var self = this;
        self.urlChangeComponentLoad(entryEl, '#revpanel-belowarticle-' + entryID); //load taboola first to make sure it appears on every article
      },

      createAdContainer: function (entryID, adSlotKey, initial, firstEntry) { // entryID = article id - for use in unique IDs, adSlotKey = placement, auto = false if triggered on ad rendered callback, firstEntry blocks mps.makeRequest('more') on initial ad load
        var self = this,
          containerTemplate, // ad container
          placement = adSlotKey,
          typeContainsBox = adSlotKey.indexOf('box'),
          typeContainsDiscussions = adSlotKey.indexOf('discussions'),
          thisEntry = 'article.entry[data-id="' + entryID + '"]';

        if (typeContainsBox !== -1) {
          placement = 'box'; // unifying boxflex and box#s for stream placement
        }
        if (typeContainsDiscussions !== -1) {
          placement = 'discussions'; // overwrites above unification for queueing until event triggered by Newsvine comments modal
        }
        containerTemplate = _.template('<div class="<%= p %>-ad"><div id="j-<%= k %>-<%= id %>-ad" class="ad-inner<% if (ll) { %> lazy-load"<% } else { %>"<% } %> data-placement="<%= k %>"></div></div>'); // underscore template for ad containers

        switch (placement) { // where to render each ad by case
          case 'mobileinterstitial':
            if (self.formFactor.indexOf('mobile') !== -1) {
              $(thisEntry).prepend(containerTemplate({p: placement, k: adSlotKey, id: entryID, ll: true}));
              $(window).trigger('ad-controller:add-waypoints', ['#j-' + adSlotKey + '-' + entryID + '-ad']);
            }
            break;
          case 'box': // can add more cases if additional boxes
            var entryContainer = thisEntry + ' > .entry-container',
              lastBoxAd = $(entryContainer + ' > .box-ad:last'),
              insertAfter = $(entryContainer).children(':nth-child(' + self.boxAdPosition(entryContainer, lastBoxAd) + ')');

            if (!lastBoxAd.length || !initial) { // creates first ad container on initial manageContainers run-through, OR if triggered by an adRenderedCallback
              if (!firstEntry && !lastBoxAd.length) { // only if this isn't the first article entry on the page
                self.pendingContainers = []; // resets array from previous loops
              }
              if (!initial) { // remove rendered item from array
                self.pendingContainers.shift();
              }
              if ($(insertAfter).length) {
                if ($(insertAfter).children('.small-image').length && $(window).width() >= 600) {
                  insertAfter = $(insertAfter).next(); // if there's a half-sized element floated above where we'd insert the ad, insert after the subsequent element
                }
                $(insertAfter).after(containerTemplate({p: placement, k: adSlotKey, id: entryID, ll: true})); // inserts the ad container after the element-bottom that's 800px or more from the entry top or last ad, ignores closing elements
                $(window).trigger('ad-controller:add-waypoints', ['#j-' + adSlotKey + '-' + entryID + '-ad']); // attaches a Waypoint to each container when created on adRenderedCallback
              }
            } else {
              self.pendingContainers.push(adSlotKey); // if this ad is neither the first box ad nor triggered on adRenderedCallback, save it in array for manually triggering
            }
            break;
          case 'discussions':
            $(window).on('ad-controller:render-discussions-ad', function (e, container, articleID) {
              container.append(containerTemplate({p: placement, k: adSlotKey, id: articleID, ll: false}));
              mps.insertAd(mps._select('#j-' + adSlotKey + '-' + articleID + '-ad'), adSlotKey);
            });
            break;
          case 'mediamodule':
            if (self.formFactor.indexOf('tablet') !== -1) {
              $(thisEntry).after(containerTemplate({p: placement, k: adSlotKey, id: entryID, ll: true})); // inserts container
              $(window).trigger('ad-controller:add-waypoints', ['#j-' + adSlotKey + '-' + entryID + '-ad']);
            }
            break;
          case 'native':
            if ($(thisEntry).hasClass('entry-native')) {
              $(thisEntry + ' > .entry-container').before(containerTemplate({
                p: placement,
                k: adSlotKey,
                id: entryID,
                ll: true
              }));
            }
            break;
        }
      },

      boxAdPosition: function (entryContainer, lastBoxAd) {
        var self = this,
          insertAfterEl = 4,
          lastElPosition = 0,
          lastBoxPosition = 0;

        if (self.formFactor.indexOf('mobile') !== -1) {
          insertAfterEl = 2;
        }

        if (lastBoxAd.length) {
          lastElPosition = $(lastBoxAd).index() + 1;
          lastBoxPosition = $(lastBoxAd).position().top + $(lastBoxAd).outerHeight();

          for (var elNumber = 1 + lastElPosition; elNumber < 10 + lastElPosition; elNumber++) { // loop through nth-childs (max 9) checking position each time, returns actual position of element closest to but not under 800px
            var nthChild = $(entryContainer).children(':nth-child(' + elNumber + ')'),
              elBottom;

            if ($(nthChild).length) {
              elBottom = $(nthChild).position().top + $(nthChild).outerHeight();
            }

            insertAfterEl = elNumber;
            if (elBottom - lastBoxPosition >= self.betweenAdsHeight) {
              break; // exit loop when elNumber found
            }
          }
        }

        return insertAfterEl;
      },

      loadComponent: function (element) {
        var componentID = $(element).data('component-name'); // assumes data-component-id attribute on .rev-panel
        if (componentID && $(element).children().length < 1) {
          mps.insertComponent(mps._select(element), componentID);
        }
      },

      urlChangeComponentLoad: function (entryEl, component) {
        var self = this;
        $('h1', entryEl).waypoint(function (direction) {
          self.loadComponent(component);
        }, {
          offset: 'bottom-in-view',
          triggerOnce: true
        });
      },

      bindMpsLoadedCallback: function () {
        var self = this;
        mps.initCallback = function () {
          self.manageContainers(self.entryToManage, false); // deferred because mps._loadset updates more slowly than the containers are created, create all ad containers, attaches listener to entry change event for creating more ad containers
        };
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
            id = '#' + adData._mps.adslot,
            placementGroup = placement,
            placementContainsBox = placement.indexOf('box'),
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

          if (placementContainsBox !== -1) {
            placementGroup = 'box'; // unifying boxflex and box#s for stream placement
          }

          switch (placementGroup) {
            case 'mobileinterstitial':
              noLabel = true;
              break;
            case 'box':
              var entryContainer = $(parentEntry).find('.entry-container'),
                lastBottom = $(parentContainer).position().top + $(parentContainer).outerHeight(),
                entryHeight = $(entryContainer).outerHeight();

              if (entryHeight - lastBottom >= ( self.boxAdHeight + self.betweenAdsHeight ) && self.pendingContainers.length > 0) {
                self.createAdContainer(parentEntryID, self.pendingContainers[0], false); // create and remove the first slot from the pending array
              }
              showAdChoices = true;
              break;
            case 'native':
              noLabel = true; // can shorten to !noLabel but it's less readable
              break;
          }
          if (!noLabel) {
            if (self.formFactor.indexOf('desktop') === -1) {
              showAdChoices = false; // no adChoices label on tablet or mobile
            }
            $(window).trigger('ad-controller:render-label', [adData._mps.adslot, showAdChoices, isEmpty]); // add the label via ad-controller.js
          }
        };
      },

      bindAdsRefreshedCallback: function () {
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
