const performLuckDraw = (tickets, prizeTiers) => {
  const availableTickets = [...tickets];
  const winnerSet = new Set();

  const winners = prizeTiers.flatMap(({ count }) => {
    return Array.from(
      { length: Math.min(count, availableTickets.length) },
      () => {
        const idx = Math.floor(Math.random() * availableTickets.length);
        const ticket = availableTickets.splice(idx, 1)[0];
        winnerSet.add(ticket.userId);

        return {
          ticketId: ticket.code,
          userId: ticket.userId,
          user: ticket.user,
        };
      }
    );
  });

  const allUserIds = new Set(tickets.map((t) => t.userId));
  const nonWinners = [...allUserIds].filter((id) => !winnerSet.has(id));

  return { winners, nonWinners };
};

module.exports = { performLuckDraw };
