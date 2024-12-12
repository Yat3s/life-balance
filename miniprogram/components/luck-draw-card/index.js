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
    hasMoreParticipants: false,
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
        hasMoreParticipants: totalParticipants > MAX_DISPLAY,
        totalParticipants,
      });
    },

    fetchLatestLuckDraw() {
      _fetchLatestLuckDraw()
        .then((res) => {
          if (res.success) {
            const participants =
              res.data.tickets?.map((ticket) => ({
                userId: ticket.userId,
                avatarUrl: ticket.user.avatarUrl,
              })) || [];

            this.setData({
              luckDraw: {
                ...res.data,
                participants,
              },
              isOngoing: res.data.winners && res.data.winners.length === 0,
            });

            this.processParticipants(participants);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch luck draw:", error);
        });
    },
  },
});
