const readline = require("readline");
const OpenAI = require("openai");
const app = require("../app");

jest.mock("readline");
jest.mock("openai");

describe("Email Generator App", () => {
  let mockQuestion;
  let mockClose;
  let mockCreate;
  let mockRL;

  beforeEach(() => {
    mockQuestion = jest.fn();
    mockClose = jest.fn();
    mockCreate = jest.fn();

    mockRL = {
      question: mockQuestion,
      close: mockClose,
    };

    const mockOpenAI = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };

    OpenAI.mockImplementation(() => mockOpenAI);

    app.initializeReadline(mockRL);
    app.initializeOpenAI("test-key");

    console.log = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("prompt function", () => {
    it("should prompt the user and return their answer", async () => {
      mockQuestion.mockImplementation((question, callback) => {
        callback("Test Answer");
      });

      const answer = await app.prompt("Test Question");
      expect(answer).toBe("Test Answer");
      expect(mockQuestion).toHaveBeenCalledWith(
        "Test Question",
        expect.any(Function)
      );
    });
  });

  describe("generateEmail function", () => {
    it("should generate an email for a non-software company", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "Generated Email Content" } }],
      });

      const email = await app.generateEmail(
        "John Doe",
        "Test Company",
        "Manufacturing"
      );

      expect(email).toBe("Generated Email Content");
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-3.5-turbo",
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.not.stringContaining(
                "We have experience investing in the software space"
              ),
            }),
          ]),
        })
      );
    });

    it("should generate an email for a software company", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "Generated Email Content" } }],
      });

      const email = await app.generateEmail(
        "Jane Smith",
        "Tech Corp",
        "Software Development"
      );

      expect(email).toBe("Generated Email Content");
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-3.5-turbo",
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining(
                "We have experience investing in the software space"
              ),
            }),
          ]),
        })
      );
    });

    it("should handle API errors", async () => {
      mockCreate.mockRejectedValueOnce(new Error("API Error"));

      const email = await app.generateEmail(
        "John Doe",
        "Test Company",
        "Manufacturing"
      );

      expect(email).toBeNull();
    });
  });

  describe("main function", () => {
    it("should run the email generation process", async () => {
      mockQuestion
        .mockImplementationOnce((q, cb) => cb("John Doe"))
        .mockImplementationOnce((q, cb) => cb("Test Company"))
        .mockImplementationOnce((q, cb) => cb("Manufacturing"));

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "Generated Email Content" } }],
      });

      await app.main();

      expect(mockQuestion).toHaveBeenCalledTimes(3);
      expect(mockCreate).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Generated Email Content")
      );
      expect(mockClose).toHaveBeenCalled();
    });

    it("should handle email generation failure", async () => {
      mockQuestion
        .mockImplementationOnce((q, cb) => cb("John Doe"))
        .mockImplementationOnce((q, cb) => cb("Test Company"))
        .mockImplementationOnce((q, cb) => cb("Manufacturing"));

      mockCreate.mockRejectedValueOnce(new Error("API Error"));

      await app.main();

      expect(mockQuestion).toHaveBeenCalledTimes(3);
      expect(mockCreate).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        "Failed to generate email. Please try again."
      );
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
