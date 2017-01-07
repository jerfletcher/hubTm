import * as utils from 'tm_tools/basicUtils';
import banner from "./banner.html";
import styles from "style-loader!./sidebar.css";
import sidebar from "./sidebar.html";

export default function() {
  utils.runWhenAvailable([
    'jQuery',
    'something.not.defined'
  ], function run($, garbage) {
    $(document).ready(function () {
      $('body').append(banner);
      $('body').append(sidebar);
    });
    console.log('example loaded');
  });
}
