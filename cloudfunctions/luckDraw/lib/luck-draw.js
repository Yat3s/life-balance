/**
 * Perform a lucky draw ensuring fair distribution of prizes
 * @param {Array<{code: string, userId: string}>} tickets - List of participating tickets
 * @param {Array<{count: number, tier: string}>} prizeTiers - Prize tiers and their quantities
 * @returns {Object} Winners grouped by prize tier
 * @throws {Error} When there are insufficient participants or no tickets
 */
function performLuckDraw(tickets, prizeTiers) {
  // Validate input parameters
  validateInput(tickets, prizeTiers);

  // Group tickets by userId for efficient access
  const ticketsByUser = groupTicketsByUser(tickets);
  const users = Object.keys(ticketsByUser);

  // Shuffle users for randomization
  const shuffledUsers = shuffleArray([...users]);

  return distributePrizes(shuffledUsers, ticketsByUser, prizeTiers);
}

/**
 * Validate input parameters for the lucky draw
 */
function validateInput(tickets, prizeTiers) {
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
}

/**
 * Group tickets by userId for efficient access
 */
function groupTicketsByUser(tickets) {
  return tickets.reduce((acc, ticket) => {
    if (!acc[ticket.userId]) {
      acc[ticket.userId] = [];
    }
    acc[ticket.userId].push(ticket);
    return acc;
  }, {});
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Select a random ticket from user's tickets
 */
function getRandomTicket(userTickets) {
  return userTickets[Math.floor(Math.random() * userTickets.length)];
}

/**
 * Distribute prizes across tiers
 */
function distributePrizes(users, ticketsByUser, prizeTiers) {
  const result = {};
  const winningUsers = new Set();

  for (const { count, tier } of prizeTiers) {
    const availableUsers = users.filter((userId) => !winningUsers.has(userId));
    const winners = [];

    const winnerCount = Math.min(count, availableUsers.length);
    for (let i = 0; i < winnerCount; i++) {
      const userId = availableUsers[i];
      const randomTicket = getRandomTicket(ticketsByUser[userId]);

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
