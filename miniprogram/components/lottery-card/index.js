import { navigateToLottery } from "../../pages/router";
import { fetchLatestLottery as _fetchLatestLottery } from "../../repository/lotteryRepo";

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {},

  data: {
    lottery: null,
    isOngoing: false,
    participantCount: 0,
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

    fetchLatestLottery() {
      _fetchLatestLottery()
        .then((res) => {
          if (res.success) {
            const now = Date.now();

            // Add participants array for avatar display
            const participants =
              res.data.tickets?.map((ticket) => ({
                userId: ticket.userId,
                avatarUrl: ticket.user.avatarUrl,
              })) || [];

            this.setData({
              lottery: {
                ...res.data,
                participants, // Add participants to lottery object
              },
              isOngoing: res.data.drawnAt > now,
              participantCount: res.data.tickets?.length || 0,
            });
            console.log(this.data.lottery);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch lottery:", error);
        });
    },
  },
});
