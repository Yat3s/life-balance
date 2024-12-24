/**
 * Perform a lucky draw ensuring fair distribution of prizes
 * @param {Array<{code: string, userId: string}>} tickets - List of participating tickets
 * @param {Array<{count: number, tier: string}>} prizeTiers - Prize tiers and their quantities
 * @returns {Object} Winners grouped by prize tier
 * @throws {Error} When there are insufficient participants or no tickets
 */
function performLuckDraw(tickets, prizeTiers) {
  // Validate inputs
  if (!tickets?.length) {
    throw new Error("No tickets available for draw");
  }

  if (!prizeTiers?.length) {
    throw new Error("No prize tiers defined");
  }

  const totalPrizes = prizeTiers.reduce((sum, tier) => sum + tier.count, 0);
  const uniqueUsers = new Set(tickets.map((ticket) => ticket.userId)).size;

  if (uniqueUsers < totalPrizes) {
    throw new Error(
      `Insufficient participants. Required: ${totalPrizes}, Current: ${uniqueUsers}`
    );
  }

  // Group tickets by userId
  const ticketsByUser = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.userId]) {
      acc[ticket.userId] = [];
    }
    acc[ticket.userId].push(ticket);
    return acc;
  }, {});

  const users = Object.keys(ticketsByUser);

  if (users.length > 1) {
    for (let i = users.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [users[i], users[j]] = [users[j], users[i]];
    }
  }

  // Distribute prizes
  const result = {};
  const winningUsers = new Set();

  for (const { count, tier } of prizeTiers) {
    const availableUsers = users.filter((userId) => !winningUsers.has(userId));
    const winners = [];

    const winnerCount = Math.min(count, availableUsers.length);
    for (let i = 0; i < winnerCount; i++) {
      const userId = availableUsers[i];
      const userTickets = ticketsByUser[userId];
      const randomTicket =
        userTickets[Math.floor(Math.random() * userTickets.length)];

      winners.push(randomTicket.code);
      winningUsers.add(userId);
    }

    result[tier] = { winners };
  }

  return result;
}

module.exports = { performLuckDraw };

// Test Lucky draw
const tickets = [
  { code: "A001", userId: "user1" },
  { code: "A002", userId: "user1" },
  { code: "A003", userId: "user2" },
  { code: "A004", userId: "user2" },
  { code: "A005", userId: "user3" },
  { code: "A006", userId: "user3" },
  { code: "A007", userId: "user4" },
  { code: "A008", userId: "user4" },
  { code: "A009", userId: "user5" },
  { code: "A010", userId: "user5" },
];

const prizeTiers = [
  { count: 2, tier: "First Prize" },
  { count: 2, tier: "Second Prize" },
  { count: 1, tier: "Third Prize" },
];

const drawResult = performLuckDraw(tickets, prizeTiers);
console.log("Test LuckDraw", drawResult);
