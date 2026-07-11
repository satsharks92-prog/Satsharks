import "../config/env";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { connectDB } from "../config/db";
import QuestionCategory from "../models/QuestionCategory";
import Question from "../models/Question";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

// Define interface for parsed items
interface ParsedQuestion {
  questionNumber: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  text: string;
  options: { label: string; text: string }[];
}

interface ParsedSolution {
  questionNumber: number;
  correctAnswer: string;
  explanation: string;
}

// Map each pair of files to a specific category and tags
const FILE_MAP = [
  {
    questions: "01_Overall_Structure_Questions.pdf",
    solutions: "02_Overall_Structure_Solutions.pdf",
    category: "SAT Practice: Overall Structure",
    tag: "overall-structure",
    type: "pdf"
  },
  {
    questions: "03_Cross_Text_Questions.pdf",
    solutions: "04_Cross_Text_Solutions.pdf",
    category: "SAT Practice: Cross-Text Connections",
    tag: "cross-text",
    type: "pdf"
  },
  {
    questions: "05_Detail_Questions.pdf",
    solutions: "06_Detail_Solutions.pdf",
    category: "SAT Practice: Detail",
    tag: "detail",
    type: "pdf"
  },
  {
    questions: "07_Claim_Example_Match_Questions.pdf",
    solutions: "08_Claim_Example_Match_Solutions.pdf",
    category: "SAT Practice: Claim-Example Match",
    tag: "claim-example-match",
    type: "pdf"
  },
  {
    questions: "DOC1_Vocab_Questions.pdf",
    solutions: "DOC2_Vocab_Solutions.pdf",
    category: "SAT Practice: Vocabulary",
    tag: "vocabulary",
    type: "pdf"
  },
  {
    questions: "DSAT_Evidence_DataGraphTable_50MCQs_QUESTIONS.pdf",
    solutions: "DSAT_Evidence_DataGraphTable_50MCQs_SOLUTIONS.pdf",
    category: "SAT Practice: Evidence (Data, Graphs, Tables)",
    tag: "evidence-data-graph-table",
    type: "pdf"
  },
  {
    questions: "DSAT_Evidence_Support_Weaken_50_Questions.docx",
    solutions: "DSAT_Evidence_Support_Weaken_50_Solutions.docx",
    category: "SAT Practice: Evidence (Support, Weaken)",
    tag: "evidence-support-weaken",
    type: "docx"
  },
  {
    questions: "DSAT_Function_Underlined_Questions.pdf",
    solutions: "DSAT_Function_Underlined_Solutions.pdf",
    category: "SAT Practice: Function of Underlined Text",
    tag: "function-underlined",
    type: "pdf"
  },
  {
    questions: "DSAT_Grammar_150_Questions.pdf",
    solutions: "DSAT_Grammar_150_Solutions.pdf",
    category: "SAT Practice: Grammar",
    tag: "grammar",
    type: "pdf"
  },
  {
    questions: "DSAT_Inference_Complete_the_Text_80_QUESTIONS.pdf",
    solutions: "DSAT_Inference_Complete_the_Text_80_SOLUTIONS.pdf",
    category: "SAT Practice: Inference & Complete the Text",
    tag: "inference",
    type: "pdf"
  },
  {
    questions: "DSAT_Main_Idea_Questions.pdf",
    solutions: "DSAT_Main_Idea_Solutions.pdf",
    category: "SAT Practice: Main Idea",
    tag: "main-idea",
    type: "pdf"
  },
  {
    questions: "DSAT_Main_Purpose_Questions.pdf",
    solutions: "DSAT_Main_Purpose_Solutions.pdf",
    category: "SAT Practice: Main Purpose",
    tag: "main-purpose",
    type: "pdf"
  },
  {
    questions: "DSAT_Quotation_Illustrates_Claim_Questions.pdf",
    solutions: "DSAT_Quotation_Illustrates_Claim_Solutions.pdf",
    category: "SAT Practice: Quotation Illustrates Claim",
    tag: "quotation-illustrates-claim",
    type: "pdf"
  },
  {
    questions: "DSAT_Transitions_80_Questions.pdf",
    solutions: "DSAT_Transitions_80_Solutions.pdf",
    category: "SAT Practice: Transitions",
    tag: "transitions",
    type: "pdf"
  },
  {
    questions: "Rhetorical_Synthesis_90_QUESTIONS.md",
    solutions: "Rhetorical_Synthesis_90_SOLUTIONS.md",
    category: "SAT Practice: Rhetorical Synthesis",
    tag: "rhetorical-synthesis",
    type: "md"
  }
];

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ");
}

function cleanMarkdownFormatting(str: string): string {
  if (!str) return str;
  return str
    .replace(/\*\*/g, "") // strip all bold markers
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "") // strip inline page numbers
    .trim();
}

function preprocessQuestionText(text: string): string {
  const lines = text.split("\n").map(l => l.trim());
  const processed: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      if (processed.length > 0 && processed[processed.length - 1] !== "") {
        processed.push("");
      }
      continue;
    }

    if (processed.length > 0) {
      const lastIdx = processed.length - 1;
      const lastLine = processed[lastIdx];

      const isNewBlock = line.match(/^Q\d+/i) || line.match(/^[A-D][\)\.]/i) || line.match(/^\[(Easy|Medium|Hard)\]/i);
      const lastLineEndsInWord = lastLine && /[a-zA-Z0-9,\-'"”\)]$/.test(lastLine) && !lastLine.endsWith(".") && !lastLine.endsWith("?") && !lastLine.endsWith("!") && !lastLine.endsWith(":");
      const currentLineIsContinuation = /^[a-z0-9\)\}\]%,;]/.test(line);

      if (!isNewBlock && (lastLineEndsInWord || currentLineIsContinuation) && lastLine !== "") {
        processed[lastIdx] = `${lastLine} ${line}`.replace(/\s+/g, " ");
        continue;
      }
    }

    processed.push(line);
  }

  return processed.join("\n").trim();
}

function isIgnoredPracticeLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^Page\s+\d+$/i.test(trimmed)) return true;
  if (/^\d+$/i.test(trimmed)) return true; // standalone page number
  if (/^--\s*\d+\s*of\s*\d+\s*--$/i.test(trimmed)) return true; // stand-alone page number tag
  if (/^DSAT Practice/i.test(trimmed)) return true;
  if (/Original MCQs/i.test(trimmed)) return true;
  if (/Solutions with Reasoning/i.test(trimmed)) return true;
  if (/DIGITAL SAT READING/i.test(trimmed)) return true;
  if (/Practice Questions/i.test(trimmed)) return true;
  if (/DOC \d+/i.test(trimmed)) return true;
  if (/QUESTIONS ONLY/i.test(trimmed)) return true;
  if (/Detailed Solutions/i.test(trimmed)) return true;
  if (/Evidence\s*—\s*/i.test(trimmed)) return true;
  return false;
}

function parseOptionsFromLine(line: string, currentQ: ParsedQuestion): boolean {
  const firstOptMatch = line.match(/[A-D][\)\.]\s/i) || line.match(/^\*\*?[A-D][\)\.]/i);
  if (!firstOptMatch) return false;

  const firstOptIndex = line.indexOf(firstOptMatch[0]);

  // Append any prefix text to the previous option if one exists
  if (firstOptIndex > 0) {
    const prefixText = line.substring(0, firstOptIndex).trim();
    if (prefixText && currentQ.options.length > 0) {
      const lastOpt = currentQ.options[currentQ.options.length - 1];
      lastOpt.text = `${lastOpt.text} ${prefixText}`.trim();
    }
  }

  // Parse all options starting from firstOptIndex
  const optLine = line.substring(firstOptIndex);
  const matches = [...optLine.matchAll(/([A-D])[\)\.]\s*(.*?)(?=\s+[A-D][\)\.]\s*|$)/gi)];

  for (const m of matches) {
    const label = m[1].toUpperCase();
    const text = m[2].trim();
    const existing = currentQ.options.find(o => o.label === label);
    if (existing) {
      existing.text = `${existing.text} ${text}`.trim();
    } else {
      currentQ.options.push({ label, text });
    }
  }

  return true;
}

// Universal parser for Questions text
function parseQuestions(text: string): ParsedQuestion[] {
  const normalized = normalizeText(text);
  const lines = normalized.split("\n").map(l => l.trim());
  const questions: ParsedQuestion[] = [];

  let currentQ: ParsedQuestion | null = null;
  let textLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isIgnoredPracticeLine(line)) continue;

    // Detect question start: "Q1.", "Q1. ", "Question 1", "**Q1. [Easy]**"
    const mdMatch = line.match(/^\*\*Q(\d+)\.\s*\[(Easy|Medium|Hard)\]\*\*/i);
    const textMatch = line.match(/^Q(\d+)\.\s*(?:\[(Easy|Medium|Hard)\]|\s*\|\s*(Easy|Medium|Hard))?/i) || line.match(/^Question\s+(\d+)\s*(?:\[(Easy|Medium|Hard)\])?/i);

    if (mdMatch || textMatch) {
      // Flush previous
      if (currentQ) {
        if (!currentQ.text) {
          currentQ.text = textLines.join("\n").trim();
        }
        questions.push(currentQ);
      }

      const qNum = parseInt((mdMatch ? mdMatch[1] : textMatch![1]), 10);
      let diffStr = (mdMatch ? mdMatch[2] : (textMatch![2] || textMatch![3]))?.toUpperCase();

      // If difficulty was not immediately matched on same line, look ahead 1 or 2 lines
      if (!diffStr) {
        for (let offset = 1; offset <= 2 && i + offset < lines.length; offset++) {
          const nextLine = lines[i + offset];
          if (/^\[(Easy|Medium|Hard)\]$/i.test(nextLine)) {
            diffStr = nextLine.replace(/[\[\]]/g, "").toUpperCase();
            i += offset;
            break;
          }
        }
      }

      currentQ = {
        questionNumber: qNum,
        difficulty: (diffStr === "EASY" || diffStr === "MEDIUM" || diffStr === "HARD" ? diffStr : "MEDIUM") as any,
        text: "",
        options: []
      };
      textLines = [];
      continue;
    }

    if (!currentQ) continue;

    // Detect if this line starts options (e.g. starts with A) or A.)
    const startsWithOptions = line.match(/^[A-D][\)\.]\s/i) || line.match(/^\*\*?[A-D][\)\.]/i);
    if (startsWithOptions) {
      // Flush question text if we are starting option A
      if (line.match(/^[A\(\*\s]*A[\)\.]/i)) {
        if (textLines.length > 0 && currentQ.text === "") {
          currentQ.text = textLines.join("\n").trim();
          textLines = [];
        }
      }
      parseOptionsFromLine(line, currentQ);
      continue;
    }

    // If we've already started collecting options, handle subsequent options or line wraps
    if (currentQ.options.length > 0) {
      const parsed = parseOptionsFromLine(line, currentQ);
      if (parsed) continue;

      const lastOpt = currentQ.options[currentQ.options.length - 1];
      lastOpt.text = `${lastOpt.text} ${line}`.trim();
      continue;
    }

    textLines.push(line);
  }

  // Flush last
  if (currentQ) {
    if (!currentQ.text) {
      currentQ.text = textLines.join("\n").trim();
    }
    questions.push(currentQ);
  }

  return questions;
}

// Universal parser for Solutions text
function parseSolutions(text: string): ParsedSolution[] {
  const normalized = normalizeText(text);
  const lines = normalized.split("\n").map(l => l.trim());
  const solutions: ParsedSolution[] = [];

  let currentSol: ParsedSolution | null = null;
  let explLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isIgnoredPracticeLine(line)) continue;

    // Detect if this line starts a new solution block
    // Formats: Q1., **Q1., Q1. [Easy], Q1. [Easy] Correct Answer: C
    const qMatch = line.match(/^Q(\d+)\b/i) || line.match(/^\*\*Q(\d+)\b/i);

    if (qMatch) {
      const qNum = parseInt(qMatch[1], 10);
      
      // Flush previous
      if (currentSol) {
        currentSol.explanation = explLines.join("\n").trim();
        solutions.push(currentSol);
        currentSol = null;
        explLines = [];
      }

      // Look for Correct Answer in this line or subsequent lines (up to 3 lines)
      let ans = "";
      let matchedIndex = -1;
      let matchedLineOffset = 0;

      for (let offset = 0; offset <= 3 && i + offset < lines.length; offset++) {
        const checkLine = lines[i + offset];
        const ansMatch = checkLine.match(/Correct Answer:\s*([A-D])/i);
        if (ansMatch) {
          ans = ansMatch[1].toUpperCase();
          matchedIndex = ansMatch.index ?? -1;
          matchedLineOffset = offset;
          break;
        }
      }

      if (ans) {
        currentSol = {
          questionNumber: qNum,
          correctAnswer: ans,
          explanation: ""
        };
        explLines = [];

        // If Correct Answer was found in the same line, append any trailing text to explanation
        if (matchedLineOffset === 0 && matchedIndex !== -1) {
          const rest = line.substring(matchedIndex + "Correct Answer: X".length).trim();
          if (rest) {
            explLines.push(rest.replace(/^[:\|\s—\.-]+/, "").trim());
          }
        }
        
        // Fast-forward the loop pointer if we consumed lines to find the answer
        i += matchedLineOffset;
        continue;
      }
    }

    if (!currentSol) continue;
    explLines.push(line);
  }

  // Flush last
  if (currentSol) {
    currentSol.explanation = explLines.join("\n").trim();
    solutions.push(currentSol);
  }

  return solutions;
}

async function extractText(filePath: string, type: "pdf" | "docx" | "md"): Promise<string> {
  if (type === "md") {
    return fs.readFileSync(filePath, "utf-8");
  } else if (type === "docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }
}

async function main() {
  const connected = await connectDB();
  if (!connected) throw new Error("Database connection failed");

  console.log("Connected to MongoDB.");

  // Delete previously imported practice questions
  const deleteResult = await Question.deleteMany({ tags: "practice-question" });
  console.log(`Cleared ${deleteResult.deletedCount} old practice questions.`);

  const practicequestionsDir = path.resolve(__dirname, "../../../practicequestions");

  for (const item of FILE_MAP) {
    console.log(`\n-----------------------------------------`);
    console.log(`Processing category: "${item.category}"`);
    console.log(`-----------------------------------------`);

    const qPath = path.join(practicequestionsDir, item.questions);
    const sPath = path.join(practicequestionsDir, item.solutions);

    if (!fs.existsSync(qPath) || !fs.existsSync(sPath)) {
      console.warn(`Missing files for ${item.category}, skipping. (looked for ${item.questions} / ${item.solutions})`);
      continue;
    }

    // 1. Ensure Category exists
    const categoryDoc = await QuestionCategory.findOneAndUpdate(
      { name: item.category },
      {
        $set: {
          name: item.category,
          section: "READING_WRITING",
          description: `Topic-specific practice for ${item.category.replace("SAT Practice: ", "")}`
        }
      },
      { upsert: true, new: true }
    );

    // 2. Extract texts
    console.log(`Extracting text from questions file...`);
    const qText = await extractText(qPath, item.type as any);
    console.log(`Extracting text from solutions file...`);
    const sText = await extractText(sPath, item.type as any);

    // 3. Parse questions & solutions
    const parsedQuestions = parseQuestions(qText);
    const parsedSolutions = parseSolutions(sText);

    console.log(`Parsed ${parsedQuestions.length} questions.`);
    console.log(`Parsed ${parsedSolutions.length} solutions.`);

    // 4. Map questions and solutions together
    const solMap = new Map<number, ParsedSolution>();
    for (const sol of parsedSolutions) {
      solMap.set(sol.questionNumber, sol);
    }

    let successCount = 0;

    for (const q of parsedQuestions) {
      const sol = solMap.get(q.questionNumber);
      if (!sol) {
        console.warn(`  WARNING: No solution found for question #${q.questionNumber} in ${item.questions}`);
        continue;
      }

      const rawExplanation = sol.explanation
        .replace(/n TRAP ALERT:/gi, "\n\nTRAP ALERT 🪤:")
        .replace(/n KEY INSIGHT:/gi, "\n\nKEY INSIGHT 💡:")
        .replace(/n FAST METHOD:/gi, "\n\nFAST METHOD ⚡:")
        .replace(/TRAP ALERT\b/gi, "\n\nTRAP ALERT 🪤")
        .replace(/KEY INSIGHT\b/gi, "\n\nKEY INSIGHT 💡")
        .replace(/FAST METHOD\b/gi, "\n\nFAST METHOD ⚡")
        .replace(/WHY WRONG:/gi, "\n\nWHY WRONG:")
        .replace(/WHY EACH OPTION IS WRONG:/gi, "\n\nWHY EACH OPTION IS WRONG:")
        .replace(/WHY EACH WRONG OPTION IS WRONG:/gi, "\n\nWHY EACH WRONG OPTION IS WRONG:")
        .replace(/\s+-\s+([A-D])\)/g, "\n• $1)")
        .replace(/\s+•\s+([A-D])\)/g, "\n• $1)")
        .replace(/\s+([A-D])\)\s+([A-Z])/g, "\n• $1) $2")
        .replace(/#+/g, "")
        .replace(/≡+/g, "")
        .replace(/\s*\n\s*/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const cleanText = cleanMarkdownFormatting(preprocessQuestionText(q.text)).replace(/#+/g, "");
      const cleanOptions = q.options.map(opt => ({
        label: opt.label,
        text: cleanMarkdownFormatting(opt.text).replace(/#+/g, "").trim()
      }));
      const formattedExplanation = cleanMarkdownFormatting(rawExplanation);

      await Question.create({
        text: cleanText,
        options: cleanOptions,
        correctAnswer: sol.correctAnswer,
        explanation: formattedExplanation,
        category: categoryDoc._id,
        difficulty: q.difficulty,
        section: "READING_WRITING",
        tags: ["practice-question", item.tag],
        source: "MANUAL",
        status: "PUBLISHED"
      });

      successCount++;
    }

    console.log(`Successfully imported ${successCount} questions for "${item.category}".`);
  }

  console.log("\n=========================================");
  console.log("Practice Questions Import Complete!");
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("Practice questions import failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
