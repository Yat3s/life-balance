import { navigateToLuckDraw } from "../../pages/router";
import { fetchLatestLuckDraw as _fetchLatestLuckDraw } from "../../repository/luckDrawRepo";

const MAX_DISPLAY = 3;

Component({
  options: {
    addGlobalClass: true,
  },
  properties: {},
  data: {
    luckDraw: null,
    displayParticipants: [],
  },

  pageLifetimes: {
    show() {
      this.fetchLatestLuckDraw();
    },
  },

  lifetimes: {
    attached() {
      this.fetchLatestLuckDraw();
    },
  },

  methods: {
    navToLuckDraw() {
      navigateToLuckDraw(this.data.luckDraw._id);
    },

    processParticipants(participants) {
      const totalParticipants = participants.length;

      this.setData({
        displayParticipants: participants.slice(0, MAX_DISPLAY),
        totalParticipants,
      });
    },

    async fetchLatestLuckDraw() {
      const latestLuckDraw = (await _fetchLatestLuckDraw())[0];
      this.setData({
        luckDraw: latestLuckDraw,
      });

      this.processParticipants(latestLuckDraw.participants);
    },
  },
});
