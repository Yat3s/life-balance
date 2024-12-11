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
    displayParticipants: [],
    hasMoreParticipants: false,
    remainingCount: 0,
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
      const maxDisplay = 6;
      const totalParticipants = participants.length;

      this.setData({
        displayParticipants: participants.slice(0, maxDisplay),
        hasMoreParticipants: totalParticipants > maxDisplay,
        remainingCount:
          totalParticipants > maxDisplay ? totalParticipants - maxDisplay : 0,
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
              participantCount: participants.length,
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
