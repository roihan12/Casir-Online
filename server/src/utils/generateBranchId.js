const prisma = require("../config/db");
const { logger } = require("./logger");


const findLastSequenceForBranch = async (branchAbbr) => {
  try {
    // Find the last branch with this abbreviation
    const lastBranch = await prisma.cabang.findFirst({
      where: {
        id: {
          startsWith: branchAbbr,
        },
      },
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
      },
    });

    // If no previous branch found, return 0
    if (!lastBranch) {
      return 0;
    }

    // Extract the sequence number from the last branch ID
    const match = lastBranch.id.match(/-(\d{4})$/);

    // If no match found, return 0
    if (!match) {
      return 0;
    }

    // Convert sequence to number
    return parseInt(match[1], 10);
  } catch (error) {
    logger.error("Error finding last branch sequence:", error);
    return 0;
  }
};

const generateBranchId = async (branchName) => {
  // Remove special characters and convert to uppercase
  const cleanedName = branchName.replace(/[^a-zA-Z\s]/g, "").toUpperCase();

  // Split the name into words
  const words = cleanedName.split(/\s+/);

  // Function to get 3-letter segments
  function get3Letters(str) {
    if (str.length <= 3) return str;
    return (
      str.slice(0, 1) +
      str.slice(Math.floor(str.length / 2), Math.floor(str.length / 2) + 1) +
      str.slice(-1)
    );
  }

  // Generate abbreviation based on input name length
  let abbr;
  if (words.length === 1) {
    // Single word: first, middle, last letter
    abbr = get3Letters(words[0]);
  } else if (words.length === 2) {
    // Two words: first letter of each word + last letter of second word
    abbr = words[0][0] + words[1][0] + words[1].slice(-1);
  } else {
    // Multiple words: first letter of first word, middle letter of middle word, last letter of last word
    abbr =
      words[0][0] +
      get3Letters(words[Math.floor(words.length / 2)]).slice(1, 2) +
      words[words.length - 1].slice(-1);
  }

  // Find last sequence number for this branch
  const lastSequence = await findLastSequenceForBranch(abbr);

  // Generate new sequential number
  const newSequence = (lastSequence + 1).toString().padStart(4, "0");

  // Combine abbreviation and sequence
  return `${abbr}-${newSequence}`;
};

module.exports = { generateBranchId };
