// src/plugins/fontawesome.js
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import {
  faChartPie,
  faPlus,
  faMoneyBill,
  faArrowRightArrowLeft,
  faHome,
  faArrowDown,
  faArrowUp,
  faFilterCircleXmark,
  faFilter,
  faPlusCircle,
  faEye,
  faPen,
  faTrash,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

library.add(
  faChartPie,
  faPlus,
  faMoneyBill,
  faArrowRightArrowLeft,
  faHome,
  faArrowDown,
  faArrowUp,
  faFilterCircleXmark,
  faFilter,
  faPlusCircle,
  faEye,
  faPen,
  faTrash,
  faBars,
  faXmark
);

export default FontAwesomeIcon;
