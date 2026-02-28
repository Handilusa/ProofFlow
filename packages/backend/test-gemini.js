import "dotenv/config";
import { GeminiService } from "./src/services/gemini.service.js";

async function testWithModel(modelName) {
    console.log(`\n--- Testing Model: ${modelName} ---`);
    process.env.GEMINI_MODEL = modelName;
    const gemini = new GeminiService();
    try {
        const result = await gemini.reasonWithAudit("Hello, respond with [STEP 1] thought [FINAL] hi");
        console.log(`Success with ${modelName}:`, result.answer);
        return true;
    } catch (err) {
        console.error(`Failed with ${modelName}:`, err.message);
        return false;
    }
}

async function runAllTests() {
    const models = ["gemini-1.5-flash-8b", "gemini-1.5-flash", "gemini-2.0-flash-exp"];
    for (const model of models) {
        if (await testWithModel(model)) break;
    }
}

runAllTests();
