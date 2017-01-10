import * as utils from 'lib/basicUtils';

/* used with all instances of [appType]-placements.js */
export default function() {
  return utils.runWhenAvailable([
    'mps',
    'jQuery',
    'Backbone',
    'jQuery.waypoints' //jquery version of waypoints
  ], function (mps, jQuery, Backbone, waypoints) {
    var AdController = Backbone.View.extend({
      responsiveSetSize: null,
      discussionsOnEntry: null,
      initialAdsRequested: null,
      allAdsReturned: [],

      initialize: function () {
        this.responsiveSetSize = mps.getResponsiveSet(); // sets named set size for monitoring changes to this variable on resize (e.g., "large")
        this.renderAds(); // creates all non-lazy-load ads
        this.renderLabels(); // binds label creation to window for triggering in [type]-placements.js
        this.bindLazyLoad(); // sets up lazy loading using Waypoints, must be triggered after renderAds
        this.bindResize(); // binds the mps.refreshAds function to resizes between responsive sets
        $(window).trigger('ad-controller:add-waypoints', ['.lazy-load']); // attaches default lazy-load waypoints
      },

      renderAds: function () {
        var requestedAds = [],
          adContainersOrder = mps.responsiveslots[mps._loadset]; // finding current ad load set to get the correct order, based on MPS weight
        for (var placement in adContainersOrder) { // loops through containers created in [type]-placements.js and creates available ads
          var adInner = $('div.ad-inner[data-placement="' + placement + '"]');
          // special cases for fronts
          if (placement === 'native' && $('.boxnative-ad').length) {
            // skip me
          } else {
            if ($(adInner).length && !$(adInner).find('div').length && !$(adInner).hasClass('lazy-load')) { // skips placing anything with an existing ad or a .lazy-load
              mps.insertAd(mps._select(adInner), placement); // inserts ad
              requestedAds.push(placement);
            }
          }
        }
        this.initialAdsRequested = requestedAds;
      },

      renderLabels: function () {
        $(window).on('ad-controller:render-label', function (e, slotID, showAdChoices, isEmpty) { // binds to window event triggered by ad callback in [type]-placements.js
          var slot = '#' + slotID,
            placement = $(slot).data('mps-slot'),
            slotContainer = $(slot).parent(),
            adLabelTemplate = _.template('<span class="ad-label j-<%= p %>-label"><% if (choices) { %><span class="ad-choices"><a id="_bapw-link" target="_blank" href="http://info.evidon.com/pub_info/1241" target="_blank"><img id="_bapw-icon" src="http://c.betrad.com/pub/icon1.png">AdChoices</a> | </span><% } %><a target="_blank" href="http://together.nbcuni.com" class="mediakit">advertisement</a></span>'); // underscore template for adLabel

          if (window.xfinityShell && window.xfinityShell.isXfinity) { // changes the ad label for all ads when Xfinity banner is present
            adLabelTemplate = _.template('<span class="ad-label ad-xfinity j-<%= p %>-label"><a href="http://xfinity.comcast.net/adinformation" target="_blank">Ad Info</a> | <a href="https://www.surveymonkey.com/s.aspx?sm=FyNNVDhj_2f2FNc2KVOHQ4eg_3d_3d" target="_blank">Ad Feedback</a></span>');
          }

          if (slotID === 'nbcnews-interstitial') { // special case for interstitial, needs to live inside differnt manually-created ad container
            $(slot).find('.ad-label').remove(); // removes ad label, in case of ad refresh call
            if (!isEmpty) {
              $(slot).prepend(adLabelTemplate({p: slotID, choices: showAdChoices}));
            }
          } else {
            $(slotContainer).prev('.ad-label, .sponsor-label').remove(); // removes ad label, in case of ad refresh call
            if (placement === 'sponsorlogo') {
              adLabelTemplate = _.template('<span class="sponsor-label j-sponsorlogo-label">presented by:</span>');
            }
            if (!isEmpty) {
              $(slotContainer).before(adLabelTemplate({p: slotID, choices: showAdChoices})); // inserts ad label
            }
          }
        });
      },

      bindLazyLoad: function () {
        $(window).on('ad-controller:add-waypoints', function (e, element) { // allows us to attach waypoints to dynamically-added ads and pass different elements to the function
          var elContext = $(element).first().data('context') || 'window',
            scrollContext = window;

          if (elContext === 'stream') {
            scrollContext = $(element).parent().parent(); // class or ID selectors don't work here, likely not yet assigned?
          } else if (elContext !== 'window') {
            scrollContext = $('#' + elContext); // works for cases not triggered on page load, e.g. the comments overlay
          }

          $(document).ready(function () { // delay until fully loaded
            $(element).waypoint(function () {
              var placement = $(this).data('placement');
              $(this).removeClass('lazy-load'); // remove lazy load class
              if (placement === 'native' && $('.boxnative-ad').length) {
                // skip me
              } else {
                mps.insertAd(mps._select(this), placement); // same as renderAds on a per-placement basis
              }
            }, {
              context: scrollContext, // allows us to define the context in the placements.js and pass it on a per-waypoint basis
              triggerOnce: true,
              offset: '100%'
            });
          });
        });
      },

      bindResize: function () {
        var self = this;
        $(window).resize(function () {
          if (mps.getResponsiveSet() !== self.responsiveSetSize) { // if on resize the current set size doesn't match the one registered at initialization, refresh or render necessary ads
            $('#nbcnews-interstitial, .interstitial-ad').remove(); // don't allow interstitial to render after initial load
            mps.responsiveApply(); // uses new MPS function to test what's available at the current responsive set size and refresh and render ads appropriately
            self.responsiveSetSize = mps.getResponsiveSet(); // reset registered ad set size for future comparisons
          }
        });
      },

      renderDiscussionsComponent: function (canonicalUrl) {
        var self = this;

        if (canonicalUrl !== self.discussionsOnEntry) {
          mps.initCallback = function () {
            self.callDiscussionsPlacements('revenue', null, canonicalUrl);
          };
          self.setMpsCallForDiscussions(canonicalUrl);
        } else {
          self.callDiscussionsPlacements('revenue', null, canonicalUrl);
        }
      },

      renderDiscussionsAds: function (container, canonicalUrl) {
        var self = this;

        if (!container.length) {
          return;
        }
        if (canonicalUrl !== self.discussionsOnEntry) {
          mps.initCallback = function () {
            self.callDiscussionsPlacements('display', container, canonicalUrl);
          };
          self.setMpsCallForDiscussions(canonicalUrl);
        } else {
          for (var loadset in mps._adloads) {
            if (_.has(mps._adloads[loadset], 'box1discussions')) { // can't rely on MPS' loadset to accurately reflect the current MPS call, so we loop through ALL loadsets and ensure that this ad existed for this MPS call previously before refreshing it
              mps.refreshAds('box1discussions');
              break;
            }
          }
          self.callDiscussionsPlacements('display', container, canonicalUrl);
        }
      },

      setMpsCallForDiscussions: function (canonicalUrl) {
        var storedMpsVars = $.extend(true, {}, window.mpscall), // make a deep copy of the object, vs reference
          entryEl = $('article.entry[data-canonical-url="' + canonicalUrl + '"]'),
          mpscallVars = entryEl.data('mpscall'),
          articleID = entryEl.data('id').toString(),
          mpsPathID = storedMpsVars.path.split(/[-]+/).pop();

        if (articleID !== mpsPathID) {
          for (var mpskey in mpscallVars) { // loop through mpscall vars and set global properties
            mpscall[mpskey] = mpscallVars[mpskey];
          }
          mpscall['cag[entryno]'] = String(entryEl.parent().children('article').index(entryEl) + 1); // finds and updates entryno by article element index
          mps.makeRequest('more'); // request more ads from MPS
          $(document.body).click(function () {
            if (!$('#discussions').length && ( window.mpscall !== storedMpsVars )) { // if the discussions modal was closed on this click, reset the mpscall
              window.mpscall = $.extend(true, {}, storedMpsVars);
              mps.makeRequest('more'); // request more ads from MPS
              adController.discussionsOnEntry = null;
            }
          });
        }
        this.discussionsOnEntry = canonicalUrl;
      },

      callDiscussionsPlacements: function (type, container, canonicalUrl) {
        var componentScript,
          articleID;

        if (type === 'display') {
          articleID = $('article.entry[data-canonical-url="' + canonicalUrl + '"]').data('id').toString();
          $(window).trigger('ad-controller:render-discussions-ad', [container, articleID]); // fails silently if no discussions display ad enabled
        } else if (type === 'revenue') {
          componentScript = document.createElement('script');
          componentScript.src = 'data:text/javascript,' + encodeURIComponent(mps.getComponent('revpanel_comments'));
          componentScript.setAttribute('id', 'revpanelcomments');
          document.body.appendChild(componentScript);
          $('#revpanelcomments').remove();
        }
      }

    });

    return AdController;
  });
};
