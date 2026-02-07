// Types
export type {
  MessageTone,
  VariableType,
  TemplateVariable,
  TemplateCategoryId,
  TemplateCategory,
  MessageTemplate,
} from './types.js'

// Template data
export {
  templateCategories,
  messageTemplates,
  getTemplatesByCategory,
  getTemplateById,
} from './data.js'

// Variable factories
export {
  VAR_RECEIVE_ADDRESS,
  VAR_EXPLOITED_ADDRESS,
  VAR_SPAMMER_ADDRESS,
  VAR_VICTIM_ADDRESS,
  VAR_RECOVERY_ADDRESS,
  VAR_CONTRACT_ADDRESS,
  VAR_DEADLINE,
  VAR_TOKEN_NAME,
  VAR_AMOUNT,
  VAR_RECOVERED_AMOUNT,
  VAR_PROJECT_NAME,
  VAR_THEFT_TX_HASH,
  VAR_CHAIN_ID,
  VAR_RECOVERY_PERCENTAGE,
} from './variables.js'

// Template engine
export {
  applyTemplate,
  allVariablesFilled,
  validateVariable,
  getVariableProgress,
  interpolateTemplate,
  extractVariableKeys,
} from './engine.js'

// Template recognition
export { identifyTemplate } from './recognition.js'

// Template data extraction
export {
  extractTemplateData,
  type ExtractedTemplateData,
} from './extraction.js'
