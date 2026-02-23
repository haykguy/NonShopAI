import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  useapiToken: process.env.USEAPI_TOKEN || '',
  useapiBaseUrl: process.env.USEAPI_BASE_URL || 'https://api.useapi.net/v1/google-flow',
  port: parseInt(process.env.PORT || '3001', 10),
  outputDir: process.env.OUTPUT_DIR
    ? path.resolve(__dirname, '..', '..', process.env.OUTPUT_DIR)
    : path.resolve(__dirname, '..', 'output'),
  llmProvider: process.env.LLM_PROVIDER || 'mock',
  llmApiKey: process.env.LLM_API_KEY || '',
  llmModel: process.env.LLM_MODEL || '',
  captchaProviders: {
    AntiCaptcha: process.env.ANTICAPTCHA_API_KEY || '',
    EzCaptcha: process.env.EZCAPTCHA_API_KEY || '',
    CapSolver: process.env.CAPSOLVER_API_KEY || '',
    YesCaptcha: process.env.YESCAPTCHA_API_KEY || '',
    SolveCaptcha: process.env.SOLVECAPTCHA_API_KEY || '',
    '2Captcha': process.env.TWOCAPTCHA_API_KEY || '',
  },
};

export function validateConfig(): void {
  if (!config.useapiToken || config.useapiToken === 'your_token_here') {
    console.warn('WARNING: USEAPI_TOKEN not set in .env file. API calls will fail.');
  }
  console.log(`[config] outputDir resolved to: ${config.outputDir}`);
}
