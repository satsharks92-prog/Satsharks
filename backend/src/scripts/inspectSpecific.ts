import "../config/env";
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

async function main() {
  const dir = "s:\\github\\my-daily-compass\\practicequestions2";
  const qPath = path.join(dir, "DSAT_Questions_Only_FINAL.pdf");
  const sPath = path.join(dir, "DSAT_Solutions_FINAL.pdf");
  
  if (fs.existsSync(qPath)) {
    const dataBuffer = fs.readFileSync(qPath);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    await parser.destroy();
    console.log("=== QUESTIONS ===");
    console.log(result.text.substring(0, 1000));
  }
  
  if (fs.existsSync(sPath)) {
    const dataBuffer = fs.readFileSync(sPath);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    await parser.destroy();
    console.log("=== SOLUTIONS ===");
    console.log(result.text.substring(0, 1000));
  }
}

main().catch(console.error);
