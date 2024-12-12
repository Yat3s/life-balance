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
    isOngoing: false,
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
      navigateToLuckDraw();
    },

    processParticipants(participants) {
      const totalParticipants = participants.length;

      this.setData({
        displayParticipants: participants.slice(0, MAX_DISPLAY),
        totalParticipants,
      });
    },

    fetchLatestLuckDraw() {
      _fetchLatestLuckDraw()
        .then((res) => {
          const participants =
            res[0].tickets?.map((ticket) => ({
              userId: ticket.user.userId,
              avatarUrl: ticket.user.avatarUrl,
            })) || [];

          this.setData({
            luckDraw: {
              ...res[0],
              participants,
            },
            isOngoing: res[0].winners && res[0].winners.length === 0,
          });

          this.processParticipants(participants);
        })
        .catch((error) => {
          console.error("Failed to fetch luck draw:", error);
        });
    },
  },
});
