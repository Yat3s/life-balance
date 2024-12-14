/**
 * Perform a lucky draw
 * @param {Array<{code: string}>} tickets - List of participating tickets
 * @param {Array<{count: number, tier: string}>} prizeTiers - Prize tiers and their quantities
 * @returns {Object} - Winners grouped by prize tier
 */
const performLuckDraw = (tickets, prizeTiers) => {
  // Deep copy the tickets array to avoid modifying the original
  let remainingTickets = [...tickets];

  // Initialize result object
  const result = {};

  // Iterate through each prize tier
  for (const { count, tier } of prizeTiers) {
    // Throw error if there aren't enough tickets remaining
    if (remainingTickets.length < count) {
      throw new Error(`Not enough tickets for tier ${tier}`);
    }

    const winners = [];

    // Randomly select specified number of winners
    for (let i = 0; i < count; i++) {
      // Generate random index
      const randomIndex = Math.floor(Math.random() * remainingTickets.length);

      // Remove and get the winning ticket from remaining tickets
      const [winner] = remainingTickets.splice(randomIndex, 1);

      // Add winning code to winners list
      winners.push(winner.code);
    }

    // Add winners of this tier to result object
    result[tier] = {
      winners,
    };
  }

  return result;
};

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
