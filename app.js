// Suppress punycode deprecation warning
process.removeAllListeners("warning");

const readline = require("readline");
const OpenAI = require("openai");

let rl;
let openaiClient;

function initializeOpenAI(apiKey) {
  openaiClient = new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
  });
}

function initializeReadline(customRL) {
  if (customRL) {
    rl = customRL;
  } else {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
}

function prompt(question) {
  if (!rl) {
    initializeReadline();
  }
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function generateEmail(ceoName, companyName, companyDescription) {
  if (!openaiClient) {
    initializeOpenAI();
  }

  const isSoftwareCompany = companyDescription
    .toLowerCase()
    .includes("software");

  let prompt = `Compose a concise, professional email from Everyday Capital to ${ceoName}, CEO of ${companyName}. 
  The email must:
  1. Use the subject line: "Exploring Investment Opportunities with Everyday Capital"
  2. Begin with "Dear ${ceoName},"
  3. Open with a brief, professional greeting.
  4. In the next paragraph, express interest in ${companyName}, mentioning why their industry (${companyDescription}) is exciting and has potential for growth and briefly highlight a key trend or driver in the industry.
  ${
    isSoftwareCompany
      ? "5. Include this exact sentence in an appropriate place: 'We have experience investing in the software space, with recent investments in Xero and Vend in New Zealand.'"
      : ""
  }
  6. In the next paragraph, propose a meeting to explore potential synergies.
  7. Close with "Best regards," followed by "Everyday Capital"`;

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert email composer for a prestigious private equity firm.",
        },
        { role: "user", content: prompt },
      ],
    });

    if (
      !response.choices ||
      !response.choices[0] ||
      !response.choices[0].message
    ) {
      throw new Error("Invalid response format from OpenAI");
    }

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating email:", error);
    return null;
  }
}

async function main(customRL) {
  try {
    if (customRL) initializeReadline(customRL);

    console.log("Welcome to the Email Generator for Everyday Capital");

    const ceoName = await prompt("Enter the CEO's name: ");
    const companyName = await prompt("Enter the company name: ");
    const companyDescription = await prompt(
      "Enter a short description of the company: "
    );

    console.log("\nGenerating email...\n");

    const email = await generateEmail(ceoName, companyName, companyDescription);

    if (email) {
      console.log("Generated Email:");
      console.log("----------------");
      console.log(email);
    } else {
      console.log("Failed to generate email. Please try again.");
    }
  } finally {
    if (rl) rl.close();
  }
}

module.exports = {
  prompt,
  generateEmail,
  main,
  initializeReadline,
  initializeOpenAI,
};

if (require.main === module) {
  main();
}
