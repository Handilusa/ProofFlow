import "dotenv/config";
import { GeminiService } from "./src/services/gemini.service.js";

async function testWithModel(modelName) {
    console.log(`\n--- Testing Model: ${modelName} ---`);
    process.env.GEMINI_MODEL = modelName;
    const gemini = new GeminiService();
    try {
        const result = await gemini.reasonWithAudit("Identificación de las caídas fuertes de Bitcoin. Para analizar el comportamiento de HBAR durante las caídas de Bitcoin, es fundamental primero identificar las fechas de estas caídas. Utilizaré la búsqueda de Google para encontrar los tres eventos de caída más significativos de Bitcoin en un período reciente que permita un análisis relevante, probablemente durante los últimos 12-24 meses, dada la volatilidad del mercado de criptomonedas.");
        console.log(`Success with ${modelName}:\n`, result.steps);
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
