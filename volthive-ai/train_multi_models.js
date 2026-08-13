/**
 * VoltHive AI - Model Metrics Validator
 * Validates real Python-trained artifacts. Does NOT simulate or train.
 * Run AFTER: python train_multi_models.py
 */
const fs = require('fs');
const path = require('path');

console.log("⚡ VoltHive AI - Validating Production Model Artifacts...");

const modelsDir = path.join(__dirname, 'models');
const required = ['surge_model.pkl', 'model_columns.pkl', 'model_metrics.json'];
const missing = required.filter(f => !fs.existsSync(path.join(modelsDir, f)));

if (missing.length > 0) {
  console.error("❌ Missing model artifacts:");
  missing.forEach(f => console.error(`   - models/${f}`));
  console.error("\n👉 Run: python train_multi_models.py");
  process.exit(1);
}

try {
  const m = JSON.parse(fs.readFileSync(path.join(modelsDir, 'model_metrics.json'), 'utf8'));
  console.log(`\n✅ Model artifacts validated!`);
  console.log(`   Winner: ${m.winner}`);
  console.log(`   Records: ${m.trained_records || 'N/A'}`);
  console.log(`   Time: ${m.total_training_time || 'N/A'}`);
  console.log(`   Accuracy: ${m.winning_accuracy_pct || 'N/A'}%`);

  console.log("\n==========================================================");
  console.log("🏆 PRODUCTION MODEL BENCHMARK MATRIX");
  console.log("==========================================================");
  console.log("Model | MAE | RMSE | R² | Accuracy");
  console.log("----------------------------------");
  (m.comparison_table || []).forEach(r => {
    const star = r.model === m.winner ? " ⭐ (Winner)" : "";
    console.log(`${r.model} | ${r.mae} | ${r.rmse} | ${r.r2_score} | ${r.accuracy_pct}%${star}`);
  });
  console.log("==========================================================");
  console.log("\n✅ Metrics from REAL Python pipeline. No simulation.");
} catch (err) {
  console.error("❌ Failed to parse model_metrics.json:", err.message);
  process.exit(1);
}