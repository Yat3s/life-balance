import { navigateToPerk } from "../../pages/router";
import { fetchLatestPartnerMerchant } from "../../repository/dashboardRepo";

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

  lifetimes: {
    attached() {
      this.fetchLatestPartnerMerchant();
    },
  },

  /**
   * Component methods
   */
  methods: {
    goToPerks() {
      navigateToPerk();
    },
    fetchLatestPartnerMerchant() {
      fetchLatestPartnerMerchant().then((res) => {
        this.setData({ partnerMerchant: res[0] });
      });
    },
  },
});
