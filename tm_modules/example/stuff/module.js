import banner from "./banner.html";
import styles from "style-loader!./sidebar.css";
import sidebar from "./sidebar.html";

export default function run($) {
  $(document).ready(function() {
    $('body').append(banner);
    $('body').append(sidebar);
  });
  console.log('example loaded');
}