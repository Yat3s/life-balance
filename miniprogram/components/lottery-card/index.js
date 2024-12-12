import { navigateToLottery } from "../../pages/router";
import { fetchLatestLottery as _fetchLatestLottery } from "../../repository/luckDrawRepo";

const MAX_DISPLAY = 3;

Component({
  options: {
    addGlobalClass: true,
  },
  properties: {},
  data: {
    lottery: null,
    isOngoing: false,
    displayParticipants: [],
    hasMoreParticipants: false,
  },

  pageLifetimes: {
    show() {
      this.fetchLatestLottery();
    },
  },

  lifetimes: {
    attached() {
      this.fetchLatestLottery();
    },
  },

  methods: {
    navToLottery() {
      navigateToLottery();
    },

    processParticipants(participants) {
      const totalParticipants = participants.length;

      this.setData({
        displayParticipants: participants.slice(0, MAX_DISPLAY),
        hasMoreParticipants: totalParticipants > MAX_DISPLAY,
        totalParticipants,
      });
    },

    fetchLatestLottery() {
      _fetchLatestLottery()
        .then((res) => {
          if (res.success) {
            const participants =
              res.data.tickets?.map((ticket) => ({
                userId: ticket.userId,
                avatarUrl: ticket.user.avatarUrl,
              })) || [];

            this.setData({
              lottery: {
                ...res.data,
                participants,
              },
              isOngoing: res.data.winners && res.data.winners.length === 0,
            });

            this.processParticipants(participants);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch lottery:", error);
        });
    },
  },
});
