/**
 * Perform a lucky draw ensuring fair distribution
 * @param {Array<{code: string, userId: string}>} tickets - List of participating tickets
 * @param {Array<{count: number, tier: string}>} prizeTiers - Prize tiers and their quantities
 * @returns {Object} - Winners grouped by prize tier
 */
function performLuckDraw(tickets, prizeTiers) {
  if (!tickets.length) {
    throw new Error("No tickets available for draw");
  }

  // Group tickets by userId for efficient access
  const ticketsByUser = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.userId]) {
      acc[ticket.userId] = [];
    }
    acc[ticket.userId].push(ticket);
    return acc;
  }, {});

  // Get unique users and shuffle them
  const users = Object.keys(ticketsByUser);
  for (let i = users.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [users[i], users[j]] = [users[j], users[i]];
  }

  const result = {};
  const winningUsers = new Set();

  // Process each prize tier
  for (const { count, tier } of prizeTiers) {
    const winners = [];
    const availableUsers = users.filter((userId) => !winningUsers.has(userId));

    // Get winners for current tier
    const winnerCount = Math.min(count, availableUsers.length);
    for (let i = 0; i < winnerCount; i++) {
      const userId = availableUsers[i];
      const userTickets = ticketsByUser[userId];

      // Randomly select one ticket from user's tickets
      const randomTicket =
        userTickets[Math.floor(Math.random() * userTickets.length)];

      winners.push(randomTicket.code);
      winningUsers.add(userId);
    }

    if (winners.length < count) {
      console.warn(
        `Not enough unique users for tier ${tier}. Required: ${count}, Found: ${winners.length}`
      );
    }

    result[tier] = { winners };
  }

  return result;
}

module.exports = { performLuckDraw };

// Test Lucky draw
const tickets = [
  { code: "A001" },
  { code: "A002" },
  { code: "A003" },
  { code: "A004" },
  { code: "A005" },
  { code: "A006" },
  { code: "A007" },
  { code: "A008" },
  { code: "A009" },
  { code: "A010" },
];

const prizeTiers = [
  { count: 2, tier: "First Prize" },
  { count: 3, tier: "Second Prize" },
  { count: 5, tier: "Third Prize" },
];

const drawResult = performLuckDraw(tickets, prizeTiers);
console.log("Test LuckDraw", drawResult);
