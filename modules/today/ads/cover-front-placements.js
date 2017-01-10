import * as utils from 'lib/basicUtils';
/* Tablet / Desktop - Cover / Fronts / Concert Series - other form factors @ app/scripts/mobile/cover-front-placements.js */

export default function() {
  return utils.runWhenAvailable([
    'mps',
    'jQuery',
    'Backbone',
    'jQuery.waypoints' //jquery version of waypoints
  ], function (mps, jQuery, Backbone, waypoints) {


    var mpsDevice = mps.pagevars && mps.pagevars.cags && mps.pagevars.cags.device;

    var AdPlacements = Backbone.View.extend({
      ltIE9: $('html').hasClass('lt-ie9'),
      formFactor: String(mpsDevice || 'desktop'),
      isConcertSeries: $('#j-cs-header').length,
      topbannerWidth: 0, // this is for use with rails placement with topbanner, allows us to call topbanner before rails
      boxAdHeight: 250,
      betweenAdsHeight: 800,
      adTrackerRun: false,
      winWidth: $(window).width(),

      initialize: function () {
        this.manageContainers(false); // create all ad containers
        if ($('.stream-sort').length) {
          this.bindMpsLoadedCallback(); // triggers ad creation on MPS ready callback
          Tdy.Events.on('stream:filter-stream-blocks', function () {
            mps.response.page.load_mode = 'more';
            mps.makeRequest('more');
          });
        }
        this.bindAdRenderedCallback(); // performs further adjustments based on rendered ad data
        this.bindAdsRefreshedCallback(); // if slot refreshed does not display at the responsive set size and needs cleanup, cleanup goes here
        this.initZergnet();
        this.initNativeTaboola();
      },

      manageContainers: function (addWaypoints) { // renders all ad containers, even if no ads being placed at current responsive set size
        var self = this,
          allSlots = mps.responsiveslots[mps._loadset];

        for (var adSlotKey in allSlots) {
          if (!$('#j-' + adSlotKey + '-ad').length) {
            self.createAdContainer(adSlotKey, true); // create each container
            if (addWaypoints) {
              $(window).trigger('ad-controller:add-waypoints', ['#j-' + adSlotKey + '-ad']);
            }
          }
        }
      },

      bindMpsLoadedCallback: function () {
        var self = this;
        mps.initCallback = function () {
          self.manageContainers(true); // deferred because mps._loadset updates more slowly than the containers are created, create all ad containers, attaches listener to entry change event for creating more ad containers
        };
      },

      initZergnet: function () {
        if ($('#zergnet-module')) {
          mps.insertComponent(mps._select('#zergnet-module'), 'revpanel-fronts');
        }
      },

      initNativeTaboola: function () {
        var self = this;

        self.createTaboolaContainer('native-taboola', '.block:eq(5)');
        self.createTaboolaContainer('native-taboola-2nd', '.block:eq(39)');

        mps.insertComponent(mps._select('#native-taboola'), 'native-cover-taboola-injector');
      },

      createTaboolaContainer: function (containerId, insertAfter) {
        var blockElement = '<article class="block single ad-hide sponsored-post-taboola" id="' + containerId + '" data-component-name="native-cover-taboola"><div id="revpanel-' + containerId + '"></div><article/>';

        $(insertAfter).after(blockElement);
      },

      createAdContainer: function (adSlotKey, initial) {
        var self = this,
          containerTemplate,
          placement = adSlotKey,
          typeContainsBox = adSlotKey.indexOf('box'),
          catTabs = $('.category-tabs'),
          ledeChildren = $('.lede').children(),
          showMeNav = $('.show-me-wrapper'),
          editorBlurb = $('.editor-l-wrapper'),
          heroHeader = $('.hero-header'),
          railsWrapper = '<div class="rails-wrapper"></div>';

        if (typeContainsBox !== -1) {
          placement = 'box'; // unifying boxflex and box#s for stream placement
        }
        containerTemplate = _.template('<div class="<%= p %>-ad"><div id="j-<%= k %>-ad" class="ad-inner<% if (ll) { %> lazy-load"<% } else { %>"<% } %> data-placement="<%= k %>"></div></div>'); // underscore template for ad containers

        switch (placement) { // where to render each ad by case
          case 'sponsorlogo':
            if (self.formFactor.indexOf('desktop') !== -1) { // shows on ONLY desktop
              if (showMeNav.length) {
                showMeNav.after(containerTemplate({p: placement, k: adSlotKey, ll: false}));
              } else if (editorBlurb.length) {
                editorBlurb.after(containerTemplate({p: placement, k: adSlotKey, ll: false}));
              } else if (heroHeader.length) {
                heroHeader.after(containerTemplate({p: placement, k: adSlotKey, ll: false}));
              } else {
                $('#header').after(containerTemplate({p: placement, k: adSlotKey, ll: false}));
                $('.sponsorlogo-ad').addClass('sponsorlogo-ad-below-header');
              }
            }
            break;
          case 'topbannerlarge':
            if (heroHeader.length && self.formFactor.indexOf('tablet') !== -1) {
              if (showMeNav.length) {
                showMeNav.after(containerTemplate({p: 'topbanner-ad ' + placement, k: adSlotKey, ll: true}));
              } else {
                heroHeader.after(containerTemplate({p: 'topbanner-ad ' + placement, k: adSlotKey, ll: true}));
              }
            } else {
              $('main.content-wrapper').before(containerTemplate({
                p: 'topbanner-ad ' + placement,
                k: adSlotKey,
                ll: false
              }));
            }
            if (heroHeader.length) {
              $('.topbannerlarge-ad').addClass('topbanner-lower');
            }
            break;
          case 'topbanner':
            if ($('.topbannerlarge-ad').length === 0 || !initial) {
              if (ledeChildren.length) {
                ledeChildren.first().after(containerTemplate({p: placement, k: adSlotKey, ll: true}));
              } else {
                if (heroHeader.length && self.formFactor.indexOf('tablet') !== -1) {
                  if (showMeNav.length) {
                    showMeNav.after(containerTemplate({p: placement, k: adSlotKey, ll: true}));
                  } else {
                    heroHeader.after(containerTemplate({p: placement, k: adSlotKey, ll: true}));
                  }
                } else {
                  $('main.content-wrapper').before(containerTemplate({p: placement, k: adSlotKey, ll: true}));
                  if (heroHeader.length) {
                    $('.topbanner-ad').addClass('topbanner-lower');
                  }
                }
                if (self.isConcertSeries) {
                  $('.topbanner-ad').addClass('cs-topbanner');
                }
              }
            }
            break;
          case 'rails':
            if (self.isConcertSeries) {
              railsWrapper = '<div class="rails-wrapper cs-rails"></div>';
            }
            if (!self.ltIE9) { // no rails on IE8
              $('body > .content').wrap(railsWrapper); // only wraps .content if .rails-wrapper not present, i.e., .content is a direct child of body
              $('<div class="rails-leftbanner-container j-ad-other"></div>').insertBefore('.content'); // third parties will insert ads into these containers. We create them here so we know they exist before applying JS.
              $('<div class="rails-rightbanner-container j-ad-other"></div>').insertAfter('.content');
              $('#header').before(containerTemplate({p: placement, k: adSlotKey, ll: false}));
            }
            break;
          case 'interstitial': // perhaps modify this to include interstitialmobile, like box?
            if (!self.ltIE9) { // no outofpage on IE8
              $('#header').before(containerTemplate({
                p: placement,
                k: adSlotKey,
                ll: false
              }), '<div id="nbcnews-interstitial" class="j-ad-other"></div>');
            }
            break;
          case 'box':
            if (catTabs.length && adSlotKey === 'boxnative') {
              catTabs.append(containerTemplate({p: adSlotKey + '-ad ' + placement, k: adSlotKey, ll: true}));
            } else if (adSlotKey !== 'boxnative') {
              $('.block:eq(' + self.boxAdPosition() + ')').before(containerTemplate({
                p: adSlotKey + '-ad block ' + placement,
                k: adSlotKey,
                ll: true
              }));
              if (!$('#j-stream .box-ad.first').length) {
                $('#j-stream .box-ad').first().addClass('first');
              }
            }
            break;
          case 'native':
            $('main.content-wrapper').prepend(containerTemplate({p: placement, k: adSlotKey, ll: true}));
            $('.cover-carousel .promo-tease, .cover-carousel .video-tease').hide();
            break;
        }


      },

      boxAdPosition: function () {
        var self = this,
          placementInStream,
          spacerBlocks = 7,
          hasFirstStreamAd = $('#j-stream .box-ad.first').length,
          hasDoubleBlock = $('#j-stream .block.first.double').length,
          positionOfPreviousAdInStream = $('#j-stream .box-ad').last().index() + 1, // add one for index offset
          numberOfExistingStreamAds = $('#j-stream .box-ad').length;

        if (!hasFirstStreamAd) { // fixed placement of first stream ad
          placementInStream = 2; // default for smallest breakpoints for cover/front/concertseries/visualfront
          if (self.winWidth >= 1024) {
            placementInStream = 4;
          }
          if (hasDoubleBlock) { // subtract one if one block takes up two spaces
            placementInStream -= 1;
          }
        } else { // uses spacer blocks after previous stream ad
          if (numberOfExistingStreamAds === 1) {
            spacerBlocks = 12; // minimum # needed for all configurations of rows and ad widths/heights, w and w/o rails, cover/fronts/visual-fronts
          } else {
            spacerBlocks = 10; // minimum # needed for subsequent placements in stream, w and w/o rails, cover/fronts/visual-fronts
          }
          placementInStream = ( positionOfPreviousAdInStream - numberOfExistingStreamAds + spacerBlocks ); // finds position of the previous ad in the article stream (subtracts ads so we're left with article count only), adds spacer article blocks
          if ($('.header-l-talent').length === 1) {
            placementInStream = placementInStream - 1; // ignore the talent header if within stream
          }
        }
        return placementInStream;
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
            case 'topbannerlarge':
              if (isEmpty && $('#j-topbanner-ad').length === 0) {
                $(parentContainer).remove();
                self.createAdContainer('topbanner', false);
                $(window).trigger('ad-controller:add-waypoints', ['#j-topbanner-ad']);
              }
              adHeight = adData.size[1];
              self.topbannerWidth = adData.size[0]; // making this accessible to rails
              noLabel = true;
              $(id).css({'height': adHeight + 'px'});
              break;
            case 'topbanner': // must load after rails in MPS (DART Ad Units heavier weight)
              adHeight = adData.size[1];
              self.topbannerWidth = adData.size[0]; // making this accessible to rails
              noLabel = true;
              $(id).css({'height': adHeight + 'px'});
              break;
            case 'rails':
              noLabel = true; // can shorten to !noLabel but it's less readable
              break;
            case 'interstitial':
              slot = 'nbcnews-interstitial';
              break;
            case 'boxnative':
              adHeight = adData.size[1];
              if (adHeight === 2 || isEmpty) { // used for serving 2x2 native
                noLabel = true;
                $(parentContainer).addClass('box-native');
              } else if ($(parentContainer).hasClass('first')) { // if boxflex doesn't exist and box1 is first, add AdChoices label. Refactor to account for all box#s being first?
                showAdChoices = true;
              }
              $('.cover-carousel .promo-tease, .cover-carousel .video-tease').show();
              break;
            case 'boxflex':
              adHeight = adData.size[1];
              if ($(parentContainer).hasClass('first')) {
                showAdChoices = true;
              }
              if (adHeight > self.boxAdHeight) { // revised to check if is taller than row-height rather than look for a specific height
                $(parentContainer).addClass('large');
              } else {
                $(parentContainer).removeClass('large');
              }
              break;
            case 'native': // combine with above Rails case, or keep separate for readability?
              noLabel = true; // can shorten to !noLabel but it's less readable
              if (isEmpty) {
                $('.cover-carousel .promo-tease, .cover-carousel .video-tease').show();
              }
              break;
          }
          if (!noLabel) {
            if (self.formFactor.indexOf('desktop') === -1) {
              showAdChoices = false; // no adChoices label on tablet or mobile
            }
            $(window).trigger('ad-controller:render-label', [slot, showAdChoices, isEmpty]); // add the label via ad-controller.js
          }
        };
      },

      bindAdsRefreshedCallback: function () {
        mps.refreshAdsCallback = function () {
          var refreshedSlots = mps._adloads['R' + mps._loadset] || [], // makes sure we're getting the refreshed object of the current adloadset, normally 0/R0
            disabledAds = mps.slotsdisabled[mps._loadset]; // disabled ad slots, not refreshed

          var adCleanup = function (placement) {
            var containers = $('div.ad-inner[data-placement="' + placement + '"]');
            switch (placement) {
              case 'rails':
                $('.rails-leftbanner-container, .rails-rightbanner-container').empty();
                break;
            }
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
