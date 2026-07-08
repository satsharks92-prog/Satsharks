import "../config/env";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { connectDB } from "../config/db";
import QuestionCategory from "../models/QuestionCategory";
import Question from "../models/Question";
import SATTest from "../models/SATTest";
import DiagnosticTest from "../models/DiagnosticTest";

interface ParsedQuestion {
  questionNumber: number;
  skill: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  text: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  isFreeResponse: boolean;
}

interface ParsedModule {
  name: string;
  section: "READING_WRITING" | "MATH";
  moduleType: "MOD1" | "MOD2_EASY" | "MOD2_HARD";
  questions: ParsedQuestion[];
}

function cleanQuestionText(lines: string[], isMath: boolean): string {
  const newLinePattern = /^(the\s+following\s+(text|passage)|adapted\s+from|text\s+\d+|passage\s+\d+|which\s+(choice|option|finding|of|phrase|word|sentence|quote|passage|student|statement|result|diagram|graph|table|inequality|equation|value|formula|system|relationship|method|data|list|figure|representation)|based\s+on|how\s+(does|do|is|should)\b|what\s+(is|does|are|value|price|height)\b|in\s+the\s+(figure|xy\-plane)\b|according\s+to\s+the|to\s+the\s+nearest|solve\b|\(student\-produced\s+response)/i;

  const cleanLines = lines.map(l => l.trim()).filter(l => l.length > 0);
  if (cleanLines.length === 0) return "";

  let result = cleanLines[0];
  let inIntro = /^the\s+following\s+(text|passage)/i.test(cleanLines[0]) || /^adapted\s+from/i.test(cleanLines[0]);
  let prevEndsWithPunct = /[.\?\!]$/.test(cleanLines[0]);

  const isMathLine = (l: string) => {
    // If it contains equals sign
    if (l.includes("=")) return true;
    // If it has math operators/variables and is short
    if (l.length < 50 && /^[a-z0-9\s\+\-\*\/\(\)\{\}\[\]\^\.\,\;\:\/\\]+$/i.test(l) && /[\+\-\*\/\^]/.test(l)) return true;
    return false;
  };

  for (let i = 1; i < cleanLines.length; i++) {
    const currentLine = cleanLines[i];
    const prevLine = cleanLines[i - 1];

    const isCurrentMath = isMathLine(currentLine);
    const isPrevMath = isMathLine(prevLine);

    // Determine if we should start a new line
    let shouldStartNewLine = false;

    if (newLinePattern.test(currentLine)) {
      shouldStartNewLine = true;
    } else if (isMath && (isCurrentMath || isPrevMath)) {
      shouldStartNewLine = true;
    } else if (inIntro && prevEndsWithPunct) {
      shouldStartNewLine = true;
      inIntro = false;
    }

    if (shouldStartNewLine) {
      result += "\n" + currentLine;
    } else {
      result += " " + currentLine;
    }

    // Update states
    if (/^the\s+following\s+(text|passage)/i.test(currentLine) || /^adapted\s+from/i.test(currentLine)) {
      inIntro = true;
    }
    prevEndsWithPunct = /[.\?\!]$/.test(currentLine);
    if (inIntro && prevEndsWithPunct) {
      inIntro = false; // end intro on this line's end
    }
  }

  return result.trim();
}

function parseQuestionsFile(filePath: string): ParsedModule[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").map(l => l.replace(/\r/g, "").trim());

  const modules: ParsedModule[] = [];
  let currentSection: "READING_WRITING" | "MATH" | null = null;
  let currentModuleType: "MOD1" | "MOD2_EASY" | "MOD2_HARD" | "MOD2" | null = null;
  let currentModuleName = "";
  let currentModuleQuestions: ParsedQuestion[] = [];

  let currentQuestion: ParsedQuestion | null = null;
  let questionTextLines: string[] = [];
  let collectingOptions = false;
  let lastOption: ParsedQuestion["options"][number] | null = null;

  const flushQuestion = () => {
    if (currentQuestion) {
      if (questionTextLines.length > 0) {
        currentQuestion.text = cleanQuestionText(questionTextLines, currentSection === "MATH");
      }
      // If there are no options, treat as free response
      if (currentQuestion.options.length === 0) {
        currentQuestion.isFreeResponse = true;
      }
      currentModuleQuestions.push(currentQuestion);
    }
    currentQuestion = null;
    questionTextLines = [];
    collectingOptions = false;
    lastOption = null;
  };

  const flushModule = () => {
    flushQuestion();
    if (currentSection && currentModuleType && currentModuleQuestions.length > 0) {
      if (currentModuleType === "MOD2") {
        modules.push({
          name: currentModuleName + " - Easier",
          section: currentSection,
          moduleType: "MOD2_EASY",
          questions: JSON.parse(JSON.stringify(currentModuleQuestions)),
        });
        modules.push({
          name: currentModuleName + " - Harder",
          section: currentSection,
          moduleType: "MOD2_HARD",
          questions: JSON.parse(JSON.stringify(currentModuleQuestions)),
        });
      } else {
        modules.push({
          name: currentModuleName,
          section: currentSection,
          moduleType: currentModuleType as "MOD1" | "MOD2_EASY" | "MOD2_HARD",
          questions: currentModuleQuestions,
        });
      }
    }
    currentModuleQuestions = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Strip markdown formatting symbols at the start and end of the line
    const cleanLine = line.replace(/^[#\*_\s]+|[#\*_\s]+$/g, "").trim();
    if (!cleanLine) continue;

    if (cleanLine.toLowerCase().startsWith("answer:")) {
      continue;
    }

    // Check for Section headers (supporting separate or combined format, e.g., "Section 1: Reading & Writing — Module 1" or "Section 1 — Module 1")
    const isSec1 = /^Section\s*1\b/i.test(cleanLine);
    const isSec2 = /^Section\s*2\b/i.test(cleanLine);

    if (isSec1 || isSec2) {
      flushModule();
      currentSection = isSec1 ? "READING_WRITING" : "MATH";

      // If module type is combined on the section line
      if (/Module 1|Mod 1/i.test(cleanLine)) {
        currentModuleType = "MOD1";
        currentModuleName = currentSection === "READING_WRITING" ? "Reading & Writing Module 1" : "Math Module 1";
      } else if (/Module 2|Mod 2/i.test(cleanLine)) {
        if (/Easier|Easy/i.test(cleanLine)) {
          currentModuleType = "MOD2_EASY";
          currentModuleName = currentSection === "READING_WRITING" ? "Reading & Writing Module 2 - Easier" : "Math Module 2 - Easier";
        } else if (/Harder|Hard/i.test(cleanLine)) {
          currentModuleType = "MOD2_HARD";
          currentModuleName = currentSection === "READING_WRITING" ? "Reading & Writing Module 2 - Harder" : "Math Module 2 - Harder";
        } else {
          currentModuleType = "MOD2";
          currentModuleName = currentSection === "READING_WRITING" ? "Reading & Writing Module 2" : "Math Module 2";
        }
      }
      continue;
    }

    // Check for separate Module headers
    if (currentSection) {
      const isMod1 = /^Module\s*1\b/i.test(cleanLine) && !/Module\s*2/i.test(cleanLine);
      const isMod2Easy = /^Module\s*2\b/i.test(cleanLine) && /Easier|Easy/i.test(cleanLine);
      const isMod2Hard = /^Module\s*2\b/i.test(cleanLine) && /Harder|Hard/i.test(cleanLine);
      const isMod2 = /^Module\s*2\b/i.test(cleanLine) && !/Easier|Easy|Harder|Hard/i.test(cleanLine);

      if (isMod1) {
        flushModule();
        currentModuleType = "MOD1";
        currentModuleName = currentSection === "READING_WRITING" ? "Reading & Writing Module 1" : "Math Module 1";
        continue;
      }
      if (isMod2Easy) {
        flushModule();
        currentModuleType = "MOD2_EASY";
        currentModuleName = currentSection === "READING_WRITING" ? "Reading & Writing Module 2 - Easier" : "Math Module 2 - Easier";
        continue;
      }
      if (isMod2Hard) {
        flushModule();
        currentModuleType = "MOD2_HARD";
        currentModuleName = currentSection === "READING_WRITING" ? "Reading & Writing Module 2 - Harder" : "Math Module 2 - Harder";
        continue;
      }
      if (isMod2) {
        flushModule();
        currentModuleType = "MOD2";
        currentModuleName = currentSection === "READING_WRITING" ? "Reading & Writing Module 2" : "Math Module 2";
        continue;
      }
    }

    // Skip helper page markers, separator lines, and grid-in instructions
    if (/^--\s*\d+\s*of\s*\d+\s*--$/i.test(cleanLine)) continue;
    if (/^Total:\s*\d+\s*Questions/i.test(cleanLine)) continue;
    if (/^Approximately\s*\d+%/i.test(cleanLine)) continue;
    if (/^\(Student-produced response\s*—\s*grid-in\)/i.test(cleanLine)) continue;
    if (cleanLine.startsWith("These questions are 100% original")) continue;
    if (cleanLine.startsWith("ADAPTIVE DIGITAL SAT")) continue;
    if (cleanLine.startsWith("DSAT_Dec_2024")) continue;

    // Check for Question start (e.g. "Question 1")
    const qMatch = cleanLine.match(/^Question\s+(\d+)\s*$/i);
    if (qMatch) {
      flushQuestion();
      
      // Look ahead for Skill and Difficulty
      let skillStr = "";
      let difficultyStr = "";
      for (let offset = 1; offset <= 3 && i + offset < lines.length; offset++) {
        const nextRawLine = lines[i + offset] ? lines[i + offset].trim() : "";
        const cleanNextLine = nextRawLine.replace(/^[#\*_\s]+|[#\*_\s]+$/g, "").trim();
        if (cleanNextLine.toLowerCase().startsWith("skill:")) {
          const skillMatch = cleanNextLine.match(/^Skill:\s*(.*?)(?:\s*\|\s*Difficulty:\s*(EASY|MEDIUM|HARD))?$/i);
          if (skillMatch) {
            skillStr = skillMatch[1].trim();
            if (skillMatch[2]) {
              difficultyStr = skillMatch[2].toUpperCase();
            }
          }
          i += offset; // skip these line(s) in main loop
          break;
        }
      }

      currentQuestion = {
        questionNumber: parseInt(qMatch[1], 10),
        skill: skillStr,
        difficulty: (difficultyStr || "MEDIUM") as "EASY" | "MEDIUM" | "HARD",
        text: "",
        options: [],
        correctAnswer: "",
        explanation: "",
        isFreeResponse: false,
      };
      continue;
    }

    if (!currentQuestion) continue;

    // Check for Option A) B) C) D)
    const optMatch = cleanLine.match(/^([A-D])\)\s*(.*)/);
    if (optMatch) {
      if (questionTextLines.length > 0) {
        currentQuestion.text = cleanQuestionText(questionTextLines, currentSection === "MATH");
        questionTextLines = [];
      }
      collectingOptions = true;
      const opt = {
        label: optMatch[1],
        text: optMatch[2].trim(),
      };
      currentQuestion.options.push(opt);
      lastOption = opt;
      continue;
    }

    if (collectingOptions && lastOption) {
      lastOption.text = `${lastOption.text} ${cleanLine}`.trim();
      continue;
    }

    // Otherwise, append to question text
    questionTextLines.push(line);
  }

  flushModule();
  return modules;
}

interface ParsedSolution {
  questionNumber: number;
  answer: string;
  explanation: string;
}

interface ParsedSolModule {
  section: "READING_WRITING" | "MATH";
  moduleType: "MOD1" | "MOD2_EASY" | "MOD2_HARD";
  solutions: ParsedSolution[];
}

function parseSolutionsFile(filePath: string): ParsedSolModule[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").map(l => l.replace(/\r/g, "").trim());

  const solModules: ParsedSolModule[] = [];
  let currentSection: "READING_WRITING" | "MATH" | null = null;
  let currentModuleType: "MOD1" | "MOD2_EASY" | "MOD2_HARD" | "MOD2" | null = null;
  let currentSolList: ParsedSolution[] = [];

  let currentSol: ParsedSolution | null = null;
  let explLines: string[] = [];
  let waitingForAnswer = false;

  const flushSol = () => {
    if (currentSol) {
      currentSol.explanation = explLines.join("\n").trim();
      currentSolList.push(currentSol);
    }
    currentSol = null;
    explLines = [];
  };

  const flushSolModule = () => {
    flushSol();
    waitingForAnswer = false;
    if (currentSection && currentModuleType && currentSolList.length > 0) {
      if (currentModuleType === "MOD2") {
        solModules.push({
          section: currentSection,
          moduleType: "MOD2_EASY",
          solutions: JSON.parse(JSON.stringify(currentSolList)),
        });
        solModules.push({
          section: currentSection,
          moduleType: "MOD2_HARD",
          solutions: JSON.parse(JSON.stringify(currentSolList)),
        });
      } else {
        solModules.push({
          section: currentSection,
          moduleType: currentModuleType as "MOD1" | "MOD2_EASY" | "MOD2_HARD",
          solutions: currentSolList,
        });
      }
    }
    currentSolList = [];
  };

  const cleanAnswer = (rawAns: string, section: string, moduleType: string, qNum: number): string => {
    let ans = rawAns.trim();
    // Strip leading/trailing markdown characters and whitespace
    ans = ans.replace(/^[#\*_\s]+|[#\*_\s]+$/g, "").trim();
    // Strip "Answer:" or "Grid-in:" or "Ans:" or "Corrected answer:" or "Best available answer:" or "Corrected:" prefix if present
    ans = ans.replace(/^(Answer|Grid-in|Ans|Corrected\s*answer|Best\s*available\s*answer|Corrected):\s*/i, "").trim();
    
    // Extract A, B, C, D if it's multiple choice
    const optMatch = ans.match(/^([A-D])(?:\s+|\)|\]|\b)/i) || ans.match(/^([A-D])$/i);
    if (optMatch) {
      return optMatch[1].toUpperCase();
    }

    // If it has "or", take the first one
    if (ans.toLowerCase().includes(" or ")) {
      ans = ans.split(/\s+or\s+/i)[0].trim();
    }
    
    // Strip "See note" math patches
    if (ans.toLowerCase().startsWith("see note")) {
      if (section === "MATH" && moduleType === "MOD1" && qNum === 18) {
        return "3111"; // DSAT1 patch
      }
      if (section === "MATH" && moduleType === "MOD2_EASY" && qNum === 19) {
        return "44"; // DSAT1 patch
      }
      return "See note";
    }

    // Clean symbols like ≈ and spaces
    return ans.replace(/[≈\s]/g, "");
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Strip markdown formatting symbols at the start and end of the line
    const cleanLine = line.replace(/^[#\*_\s]+|[#\*_\s]+$/g, "").trim();
    if (!cleanLine) continue;

    if (/^Quick-Reference\s*Answer/i.test(cleanLine)) {
      flushSolModule();
      currentSection = null;
      currentModuleType = null;
      continue;
    }

    // Check for Section headers (supporting separate or combined format, e.g., "Section 1: Reading & Writing — Module 1" or "Section 1 — Module 1")
    const isSec1 = /^Section\s*1\b/i.test(cleanLine);
    const isSec2 = /^Section\s*2\b/i.test(cleanLine);

    if (isSec1 || isSec2) {
      flushSolModule();
      currentSection = isSec1 ? "READING_WRITING" : "MATH";
      if (/Module\s*1|Mod\s*1/i.test(cleanLine)) {
        currentModuleType = "MOD1";
      } else if (/Module\s*2|Mod\s*2/i.test(cleanLine)) {
        if (/Easier|Easy/i.test(cleanLine)) currentModuleType = "MOD2_EASY";
        else if (/Harder|Hard/i.test(cleanLine)) currentModuleType = "MOD2_HARD";
        else currentModuleType = "MOD2";
      }
      continue;
    }

    if (currentSection) {
      const isMod1 = /^Module\s*1\b/i.test(cleanLine) && !/Module\s*2/i.test(cleanLine);
      const isMod2Easy = /^Module\s*2\b/i.test(cleanLine) && /Easier|Easy/i.test(cleanLine);
      const isMod2Hard = /^Module\s*2\b/i.test(cleanLine) && /Harder|Hard/i.test(cleanLine);
      const isMod2 = /^Module\s*2\b/i.test(cleanLine) && !/Easier|Easy|Harder|Hard/i.test(cleanLine);
      if (isMod1 || isMod2Easy || isMod2Hard || isMod2) {
        flushSolModule();
        if (isMod1) currentModuleType = "MOD1";
        else if (isMod2Easy) currentModuleType = "MOD2_EASY";
        else if (isMod2Hard) currentModuleType = "MOD2_HARD";
        else currentModuleType = "MOD2";
        continue;
      }
    }

    // Check for Question start in solutions (supporting formats: Question 1, Q1, Q1.)
    let qMatch = cleanLine.match(/^Question\s+(\d+)\b(.*)/i) || cleanLine.match(/^Q(\d+)\b(.*)/i);
    if (qMatch) {
      flushSol();
      const questionNumber = parseInt(qMatch[1], 10);
      const rest = qMatch[2].replace(/^[:\s—\.-]+/, "").trim(); // strip leading colon, dash, dot, space

      // Check if the answer is inline
      const hasAnswerInline = /^[A-D](?:\s+|\)|\]|$)/i.test(rest) || 
                              /^(Answer|Grid-in|Ans|Corrected\s*answer|Best\s*available\s*answer|Corrected):/i.test(rest) ||
                              /^[A-D]$/i.test(rest) ||
                              /^see\s+note/i.test(rest) ||
                              /^[-−]?\d+/i.test(rest) ||
                              (currentSection === "MATH" && rest.length > 0);
                              
      let answer = "";
      if (hasAnswerInline) {
        answer = cleanAnswer(rest, currentSection || "", currentModuleType || "", questionNumber);
      } else {
        waitingForAnswer = true;
      }

      currentSol = {
        questionNumber,
        answer,
        explanation: "",
      };

      if (hasAnswerInline) {
        // Strip out the answer prefix to get potential starting explanation
        const cleanRest = rest.replace(/^(Answer|Grid-in|Ans|Corrected\s*answer|Best\s*available\s*answer|Corrected):\s*/i, "").trim();
        const optMatch = cleanRest.match(/^([A-D])(?:\s+|\)|\]|\b)/i) || cleanRest.match(/^([A-D])$/i);
        let firstExpl = cleanRest;
        if (optMatch) {
          firstExpl = cleanRest.substring(optMatch[0].length).trim();
        } else if (/^[-−]?\d+/.test(cleanRest)) {
          const mathAnsPrefix = cleanRest.match(/^[-−]?\d+(?:\/\d+)?(?:\.\d+)?/);
          if (mathAnsPrefix) {
            firstExpl = cleanRest.substring(mathAnsPrefix[0].length).trim();
          }
        }
        if (firstExpl) {
          explLines.push(firstExpl);
        }
      }
      continue;
    }

    if (waitingForAnswer && currentSol) {
      const isAnswerLine = /^(Answer|Grid-in|Ans|Corrected\s*answer|Best\s*available\s*answer|Corrected):/i.test(cleanLine) ||
                           /^[A-D](?:\s+|\)|\]|$)/i.test(cleanLine) ||
                           /^[-−]?\d+/.test(cleanLine) ||
                           /^see\s+note/i.test(cleanLine) ||
                           (currentSection === "MATH" && cleanLine.length > 0);
      if (isAnswerLine) {
        currentSol.answer = cleanAnswer(cleanLine, currentSection || "", currentModuleType || "", currentSol.questionNumber);
        waitingForAnswer = false;

        const cleanRest = cleanLine.replace(/^(Answer|Grid-in|Ans|Corrected\s*answer|Best\s*available\s*answer|Corrected):\s*/i, "").trim();
        const optMatch = cleanRest.match(/^([A-D])(?:\s+|\)|\]|\b)/i) || cleanRest.match(/^([A-D])$/i);
        let firstExpl = cleanRest;
        if (optMatch) {
          firstExpl = cleanRest.substring(optMatch[0].length).trim();
        } else if (/^\d+/.test(cleanRest)) {
          const mathAnsPrefix = cleanRest.match(/^\d+(?:\/\d+)?(?:\.\d+)?/);
          if (mathAnsPrefix) {
            firstExpl = cleanRest.substring(mathAnsPrefix[0].length).trim();
          }
        }
        if (firstExpl) {
          explLines.push(firstExpl);
        }
        continue;
      }
    }

    if (currentSol) {
      explLines.push(line);
    }
  }

  flushSolModule();
  return solModules;
}

function classifyCategory(skill: string, section: "READING_WRITING" | "MATH"): string {
  const s = skill.toLowerCase();
  if (section === "READING_WRITING") {
    if (s.includes("vocabulary") || s.includes("fill-in")) return "SAT Vocabulary";
    if (s.includes("grammar") || s.includes("convention") || s.includes("sentence") || s.includes("punctuation") || s.includes("transition")) return "SAT Grammar & Writing";
    return "SAT Reading Comprehension";
  }
  if (s.includes("geometry") || s.includes("triangle") || s.includes("circle") || s.includes("angle") || s.includes("area") || s.includes("volume") || s.includes("perimeter")) return "SAT Geometry";
  if (s.includes("data") || s.includes("statistic") || s.includes("probability") || s.includes("scatter") || s.includes("table") || s.includes("graph") || s.includes("percent")) return "SAT Data & Statistics";
  if (s.includes("quadratic") || s.includes("polynomial") || s.includes("exponential") || s.includes("function") || s.includes("nonlinear") || s.includes("radical") || s.includes("exponent")) return "SAT Advanced Math";
  return "SAT Algebra";
}

async function ensureCategories(): Promise<Map<string, mongoose.Types.ObjectId>> {
  const categories = [
    { name: "SAT Reading Comprehension", section: "READING_WRITING" as const, description: "Reading passages and comprehension" },
    { name: "SAT Grammar & Writing", section: "READING_WRITING" as const, description: "Grammar, usage, and rhetoric" },
    { name: "SAT Vocabulary", section: "READING_WRITING" as const, description: "Vocabulary in context" },
    { name: "SAT Algebra", section: "MATH" as const, description: "Linear equations, inequalities, systems" },
    { name: "SAT Advanced Math", section: "MATH" as const, description: "Quadratics, polynomials, exponentials" },
    { name: "SAT Geometry", section: "MATH" as const, description: "Geometry and trigonometry" },
    { name: "SAT Data & Statistics", section: "MATH" as const, description: "Data analysis, probability, statistics" },
  ];

  for (const cat of categories) {
    await QuestionCategory.updateOne(
      { name: cat.name },
      { $set: cat },
      { upsert: true }
    );
  }

  const all = await QuestionCategory.find({ name: { $regex: /^SAT / } });
  return new Map(all.map((c) => [c.name, c._id as mongoose.Types.ObjectId]));
}

async function main() {
  const connected = await connectDB();
  if (!connected) throw new Error("Database connection failed");

  console.log("-----------------------------------------");
  console.log("1. CLEARING PREVIOUS NON-ADAPTIVE SAT DATA");
  console.log("-----------------------------------------");
  
  // Clear previous questions from SAT source
  const deletedQuestions = await Question.deleteMany({ source: "SAT" });
  console.log(`Deleted ${deletedQuestions.deletedCount} legacy SAT questions.`);

  // Clear previous SAT mock tests
  const deletedTests = await SATTest.deleteMany({});
  console.log(`Deleted ${deletedTests.deletedCount} legacy SAT tests.`);

  // Clear previous SAT diagnostic tests
  const deletedDiagnostics = await DiagnosticTest.deleteMany({ title: /SAT Practice Test/i });
  console.log(`Deleted ${deletedDiagnostics.deletedCount} legacy SAT diagnostic tests.`);

  const digitalsatpapersDir = path.resolve(__dirname, "../../../digitalsatpapers");
  
  // Ensure categories exist
  const categoryMap = await ensureCategories();

  const uploadsDir = path.resolve(__dirname, "../../uploads/sat");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const testsToImport = [1, 2, 3, 4, 5, 6, 7, 10];
  for (const tNum of testsToImport) {
    console.log(`\n=========================================`);
    console.log(`PROCESSING DSAT TEST #${tNum}`);
    console.log(`=========================================`);

    let questionsPath = path.join(digitalsatpapersDir, `DSAT${tNum}_text.txt`);
    if (!fs.existsSync(questionsPath)) {
      questionsPath = path.join(digitalsatpapersDir, `DSAT${tNum}.md`);
    }

    let solutionsPath = path.join(digitalsatpapersDir, `DSAT${tNum}sol_text.txt`);
    if (!fs.existsSync(solutionsPath)) {
      solutionsPath = path.join(digitalsatpapersDir, `DSAT${tNum}sol.md`);
    }

    if (!fs.existsSync(questionsPath) || !fs.existsSync(solutionsPath)) {
      console.warn(`DSAT${tNum} questions or solutions text file not found, skipping.`);
      continue;
    }

    // Auto-detect and swap if files are named/swapped incorrectly
    const fileAContent = fs.readFileSync(questionsPath, "utf-8");
    const first120 = fileAContent.substring(0, 120).toUpperCase();
    if (first120.includes("ANSWER KEY") || first120.includes("SOLUTIONS")) {
      console.log(`[Self-Healing] Swapped file detected for DSAT${tNum}. Correcting...`);
      const temp = questionsPath;
      questionsPath = solutionsPath;
      solutionsPath = temp;
    }

    const parsedModules = parseQuestionsFile(questionsPath);
    const parsedSolModules = parseSolutionsFile(solutionsPath);

    console.log(`Parsed ${parsedModules.length} modules from questions file.`);
    console.log(`Parsed ${parsedSolModules.length} modules from solutions file.`);

    // Build solutions lookup map: section-moduleType-qNum -> solution
    const solMap = new Map<string, ParsedSolution>();
    for (const solMod of parsedSolModules) {
      for (const sol of solMod.solutions) {
        const key = `${solMod.section}-${solMod.moduleType}-${sol.questionNumber}`;
        solMap.set(key, sol);
      }
    }

    const orderedModuleKeys: { section: "READING_WRITING" | "MATH"; moduleType: "MOD1" | "MOD2_EASY" | "MOD2_HARD"; name: string }[] = [
      { section: "READING_WRITING", moduleType: "MOD1", name: "Reading & Writing Module 1" },
      { section: "READING_WRITING", moduleType: "MOD2_EASY", name: "Reading & Writing Module 2 - Easier" },
      { section: "READING_WRITING", moduleType: "MOD2_HARD", name: "Reading & Writing Module 2 - Harder" },
      { section: "MATH", moduleType: "MOD1", name: "Math Module 1" },
      { section: "MATH", moduleType: "MOD2_EASY", name: "Math Module 2 - Easier" },
      { section: "MATH", moduleType: "MOD2_HARD", name: "Math Module 2 - Harder" }
    ];

    const satModules = [];

    for (let idx = 0; idx < orderedModuleKeys.length; idx++) {
      const keyConfig = orderedModuleKeys[idx];
      
      // Find the parsed module
      const parsedMod = parsedModules.find(m => m.section === keyConfig.section && m.moduleType === keyConfig.moduleType);
      if (!parsedMod) {
        throw new Error(`Could not find parsed module for ${keyConfig.name}`);
      }

      const questionIds: mongoose.Types.ObjectId[] = [];
      console.log(`Processing ${keyConfig.name} (${parsedMod.questions.length} questions)...`);

      for (const q of parsedMod.questions) {
        const solKey = `${keyConfig.section}-${keyConfig.moduleType}-${q.questionNumber}`;
        const sol = solMap.get(solKey);
        if (!sol || !sol.answer) {
          throw new Error(`No answer/solution found for question ${q.questionNumber} in ${keyConfig.name}. parsedSol: ${JSON.stringify(sol)}`);
        }

        const catName = classifyCategory(q.skill, keyConfig.section);
        const categoryId = categoryMap.get(catName);
        if (!categoryId) {
          throw new Error(`Category not found: ${catName}`);
        }

        const uniqueTag = `dsat-${tNum}-m${idx}-q${q.questionNumber}`;
        
        const doc = await Question.create({
          text: q.text,
          options: q.options,
          correctAnswer: sol.answer,
          explanation: sol.explanation,
          category: categoryId,
          difficulty: q.difficulty,
          section: keyConfig.section,
          tags: [uniqueTag, `dsat-${tNum}`, `dsat-${tNum}-m${idx}`, q.skill],
          source: "SAT",
          status: "PUBLISHED"
        });

        questionIds.push(doc._id as mongoose.Types.ObjectId);
      }

      satModules.push({
        name: keyConfig.name,
        section: keyConfig.section,
        moduleNumber: idx + 1, // index-based module number
        questions: questionIds,
        timeLimitMinutes: keyConfig.section === "READING_WRITING" ? 32 : 35
      });
    }

    // Copy PDF to uploads
    const pdfSource = path.resolve(digitalsatpapersDir, `DSAT${tNum}.pdf`);
    let pdfUrl = "";
    if (fs.existsSync(pdfSource)) {
      const pdfDest = path.join(uploadsDir, `DSAT${tNum}.pdf`);
      fs.copyFileSync(pdfSource, pdfDest);
      pdfUrl = `/uploads/sat/DSAT${tNum}.pdf`;
      console.log(`PDF copied to uploads: ${pdfDest}`);
    }

    const test = await SATTest.create({
      title: `Digital SAT Practice Test ${tNum}`,
      description: `Adaptive Digital SAT practice test #${tNum}. Includes full module routing based on your performance.`,
      year: 2025,
      testNumber: tNum,
      isAdaptive: true,
      modules: satModules,
      breakDurationMinutes: 10,
      isActive: true,
      accessLevel: "FREE",
      pdfUrl
    });

    console.log(`Created SAT Test: ${test.title}`);
  }

  console.log("Import completed successfully!");
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
