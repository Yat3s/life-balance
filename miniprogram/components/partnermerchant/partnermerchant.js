import { navigateToPerk } from "../../pages/router";

Component({
  /**
   * Component properties
   */
  options: {
    addGlobalClass: true,
  },
  properties: {},

  /**
   * Component initial data
   */
  data: {},

  /**
   * Component methods
   */
  methods: {
    goToPerks() {
      navigateToPerk();
    },
  },
});
