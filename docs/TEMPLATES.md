# 📝 Callout Template System

Complete guide to creating, customizing, and extending message templates.

## Table of Contents

1. [Overview](#overview)
2. [Template Structure](#template-structure)
3. [Categories](#categories)
4. [Variables](#variables)
5. [Creating Templates](#creating-templates)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

---

## Overview

Callout's template system provides pre-written message templates organized by tone and use case. Templates support variable substitution for dynamic content.

### Why Templates?

- **Save time** — don't rewrite common messages
- **Consistency** — standard format across callouts
- **Professional tone** — legal/formal language
- **Variable injection** — auto-fill addresses, amounts, deadlines

---

## Template Structure

Each template is defined as:

```ts
interface MessageTemplate {
  id: string                  // Unique identifier
  categoryId: string          // Parent category
  name: string                // Display name
  tone: 'cordial' | 'firm' | 'hostile'  // Severity level
  content: string             // Template text with {{placeholders}}
  placeholders: string[]      // List of variable names
}
```

### Example

```ts
{
  id: 'white-hat-bounty',
  categoryId: 'scam-recovery',
  name: 'White Hat Bounty Offer',
  tone: 'cordial',
  content: `Dear recipient,

I noticed funds were transferred from {{return_address}} to {{target_address}}.

If this was accidental or you're a white hat hacker, please return the funds and I will send {{bounty_amount}} as a reward.

Return address: {{return_address}}
Deadline: {{deadline}}

Thank you.`,
  placeholders: ['return_address', 'target_address', 'bounty_amount', 'deadline'],
}
```

---

## Categories

Templates are organized into categories for easy browsing.

### Category Structure

```ts
interface TemplateCategory {
  id: string           // Unique ID
  name: string         // Display name
  description: string  // Short description
  color: string        // Chakra UI color (e.g., 'green', 'red')
  emoji: string        // Icon emoji
}
```

### Current Categories

| ID | Name | Description | Color | Emoji |
|----|------|-------------|-------|-------|
| `scam-recovery` | Scam Recovery | Recover stolen funds | green | 🤝 |
| `rug-pull` | Rug Pull Callout | Call out rug pulls | yellow | ⚠️ |
| `approval-exploit` | Approval Exploit | Unauthorized token approvals | orange | 🔓 |
| `public-warning` | Public Warning | Warn the community | red | 🚨 |
| `custom` | Custom Message | Write your own | gray | ✍️ |

### Adding a Category

Edit `src/config/templates.ts`:

```ts
export const templateCategories: TemplateCategory[] = [
  // ...existing categories
  {
    id: 'my-category',
    name: 'My Category',
    description: 'Short description',
    color: 'blue',
    emoji: '🎯',
  },
]
```

**Color options:** `green`, `yellow`, `orange`, `red`, `blue`, `purple`, `pink`, `gray`

**Emoji guidelines:**
- Use a single emoji
- Choose something recognizable
- Avoid skin tone variations

---

## Variables

Templates support variable placeholders that are replaced with real values when the message is sent.

### Syntax

Use double curly braces:

```
{{variable_name}}
```

### Available Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{return_address}}` | Your wallet address (auto-filled) | `0xABCD...1234` |
| `{{target_address}}` | Recipient's address | `0x1234...ABCD` |
| `{{amount}}` | Amount owed/stolen | `10 ETH` |
| `{{bounty_amount}}` | Reward amount | `1 ETH` |
| `{{deadline}}` | Date/time deadline | `February 10, 2026` |
| `{{token_name}}` | Token symbol | `USDC` |
| `{{contract_address}}` | Contract address | `0x5678...9ABC` |
| `{{transaction_hash}}` | Tx hash | `0xabcd...ef01` |

### Adding New Variables

To add a new variable:

1. **Define it in `src/utils/templateEngine.ts`:**

```ts
export const TEMPLATE_VARIABLES = {
  return_address: 'Your wallet address',
  target_address: 'Target address',
  // ... existing variables
  my_variable: 'Description of my variable',
}
```

2. **Add validation logic (if needed):**

```ts
export function validateVariable(name: string, value: string): boolean {
  if (name === 'my_variable') {
    // Custom validation
    return value.length > 0
  }
  // ... existing validation
}
```

3. **Update the UI (`MessageComposer.tsx`) if variable needs a custom input field.**

### Variable Substitution

The `applyTemplate` function replaces placeholders:

```ts
import { applyTemplate } from '../utils/templateEngine'

const template = {
  content: 'Send {{amount}} to {{return_address}}',
  placeholders: ['amount', 'return_address'],
}

const vars = {
  amount: '10 ETH',
  return_address: '0xABCD1234',
}

const result = applyTemplate(template, vars)
// Result: "Send 10 ETH to 0xABCD1234"
```

---

## Creating Templates

### Step 1: Define the Template

Edit `src/config/templates.ts`:

```ts
export const templates: MessageTemplate[] = [
  // ... existing templates
  {
    id: 'my-new-template',
    categoryId: 'scam-recovery',  // Pick a category
    name: 'My New Template',
    tone: 'firm',                 // cordial | firm | hostile
    content: `Dear {{target_address}},

Your wallet received {{amount}} from {{return_address}} on {{date}}.

This was sent in error. Please return the funds within {{deadline}} to avoid legal action.

Thank you.`,
    placeholders: ['target_address', 'amount', 'return_address', 'date', 'deadline'],
  },
]
```

### Step 2: Write Tests

Add tests to `src/config/templates.test.ts`:

```ts
describe('my-new-template', () => {
  it('exists in scam-recovery category', () => {
    const templates = getTemplatesByCategory('scam-recovery')
    const found = templates.find(t => t.id === 'my-new-template')
    expect(found).toBeDefined()
  })

  it('has correct placeholders', () => {
    const t = templates.find(t => t.id === 'my-new-template')!
    expect(t.placeholders).toContain('target_address')
    expect(t.placeholders).toContain('amount')
  })

  it('applies variables correctly', () => {
    const t = templates.find(t => t.id === 'my-new-template')!
    const result = applyTemplate(t, {
      target_address: '0x1234',
      amount: '10 ETH',
      return_address: '0xABCD',
      date: 'Feb 1',
      deadline: 'Feb 10',
    })
    expect(result).toContain('0x1234')
    expect(result).toContain('10 ETH')
  })
})
```

### Step 3: Test in UI

1. Run the app: `npm run dev`
2. Go to "Send Callout" tab
3. Select your new category
4. Find your new template
5. Fill in the variables
6. Click "Preview" to see the final message
7. Verify all placeholders are replaced correctly

### Step 4: Submit PR

```bash
git add src/config/templates.ts src/config/templates.test.ts
git commit -m "feat: add my-new-template for scam recovery"
git push origin feat/add-new-template
# Open PR on GitHub
```

---

## Best Practices

### Writing Effective Templates

1. **Be clear and concise**
   - State the problem upfront
   - Explain what you want
   - Set a deadline

2. **Use professional language**
   - Avoid profanity or threats
   - Keep tone appropriate to severity (cordial → firm → hostile)
   - Legal language works better than emotional appeals

3. **Include actionable steps**
   - "Return funds to {{return_address}}"
   - "Contact me at {{contact_info}}"
   - "Respond by {{deadline}}"

4. **Provide context**
   - Mention the transaction or event
   - Include amounts, dates, or addresses
   - Make it clear why you're reaching out

### Template Tone Guidelines

#### 🤝 Cordial (Green)
- **Use when:** Assuming good faith, accident, white hat
- **Tone:** Polite, professional, collaborative
- **Keywords:** "please", "thank you", "noticed", "reward"
- **Example:** "Dear recipient, I believe funds were sent by accident..."

#### ⚠️ Firm (Yellow)
- **Use when:** After cordial attempts failed, need urgency
- **Tone:** Assertive, deadline-driven, but still professional
- **Keywords:** "demand", "deadline", "legal obligation", "required"
- **Example:** "This is a formal demand to return {{amount}} by {{deadline}}."

#### 🚨 Hostile (Red)
- **Use when:** Last resort, clearly malicious, rug pull
- **Tone:** Threatening (legal), public warning, maximum pressure
- **Keywords:** "warning", "authorities", "lawsuit", "criminal", "exposed"
- **Example:** "If funds are not returned within 48 hours, legal action will begin."

### Variable Naming

- Use `snake_case` (not camelCase)
- Be descriptive: `return_address` > `addr`
- Avoid abbreviations unless standard (ETH, BTC, USDC)
- Keep names consistent across templates

### Content Guidelines

- **Max length:** ~500 characters (gas efficiency)
- **Line breaks:** Use `\n\n` for paragraphs
- **Formatting:** Plain text only (no markdown, HTML, or emojis in content)
- **Signatures:** Optional; keep short

---

## Examples

### Example 1: White Hat Bounty

```ts
{
  id: 'white-hat-bounty',
  categoryId: 'scam-recovery',
  name: 'White Hat Bounty Offer',
  tone: 'cordial',
  content: `Hello,

I noticed {{amount}} was transferred from {{return_address}} to {{target_address}}.

If you're a white hat hacker or this was accidental, please return the funds. I will send {{bounty_amount}} as a reward for your honesty.

Return to: {{return_address}}
Deadline: {{deadline}}

Thank you.`,
  placeholders: ['amount', 'return_address', 'target_address', 'bounty_amount', 'deadline'],
}
```

**When to use:** Someone took your funds, but you're not sure if it's malicious.

**Variables:**
- `amount`: "10 ETH"
- `bounty_amount`: "1 ETH"
- `deadline`: "February 10, 2026"

---

### Example 2: Rug Pull Callout

```ts
{
  id: 'rug-pull-public',
  categoryId: 'rug-pull',
  name: 'Public Rug Pull Callout',
  tone: 'hostile',
  content: `PUBLIC NOTICE:

{{target_address}} executed a rug pull on {{token_name}}.

Total stolen: {{amount}}
Contract: {{contract_address}}
Transaction: {{transaction_hash}}

This address is a confirmed scammer. Do not interact.

All evidence has been archived and will be submitted to authorities.`,
  placeholders: ['target_address', 'token_name', 'amount', 'contract_address', 'transaction_hash'],
}
```

**When to use:** Confirmed rug pull, want to warn the community.

**Variables:**
- `token_name`: "SCAMTOKEN"
- `amount`: "500 ETH"
- `contract_address`: "0x1234..."
- `transaction_hash`: "0xabcd..."

---

### Example 3: Accidental Send

```ts
{
  id: 'accidental-send',
  categoryId: 'scam-recovery',
  name: 'Accidental Send Request',
  tone: 'cordial',
  content: `Hello,

I accidentally sent {{amount}} to {{target_address}} on {{date}}.

This was a mistake (wrong address). Could you please return the funds to {{return_address}}?

I'm happy to cover gas costs. Please respond by {{deadline}}.

Thank you for your understanding.`,
  placeholders: ['amount', 'target_address', 'date', 'return_address', 'deadline'],
}
```

**When to use:** You fat-fingered an address, asking nicely for return.

**Variables:**
- `amount`: "5 ETH"
- `date`: "February 1, 2026"
- `deadline`: "February 5, 2026"

---

### Example 4: Approval Exploit

```ts
{
  id: 'approval-exploit-notice',
  categoryId: 'approval-exploit',
  name: 'Approval Exploit Notice',
  tone: 'firm',
  content: `NOTICE:

{{target_address}} exploited an unlimited token approval on {{contract_address}} and drained {{amount}} {{token_name}} from {{return_address}}.

This is theft via approval exploit.

Return the funds to {{return_address}} within {{deadline}} or I will:
1. Report to law enforcement
2. File a lawsuit
3. Publish your identity (if discovered)

Transaction hash: {{transaction_hash}}`,
  placeholders: ['target_address', 'contract_address', 'amount', 'token_name', 'return_address', 'deadline', 'transaction_hash'],
}
```

**When to use:** Someone used an old approval to drain your tokens.

**Variables:**
- `token_name`: "USDC"
- `amount`: "10,000"
- `contract_address`: "0x5678..."

---

## Advanced: Dynamic Templates

### Client-Side Template Loading

(Future feature) Load templates from a JSON file:

```ts
// src/config/templates.json
{
  "templates": [
    {
      "id": "my-template",
      "categoryId": "custom",
      "name": "My Template",
      "tone": "firm",
      "content": "...",
      "placeholders": ["amount"]
    }
  ]
}
```

Import in component:

```ts
import customTemplates from '../config/templates.json'
```

### User-Created Templates

(Future feature) Allow users to save custom templates in localStorage:

```ts
const savedTemplates = JSON.parse(localStorage.getItem('user_templates') || '[]')

function saveTemplate(template: MessageTemplate) {
  savedTemplates.push(template)
  localStorage.setItem('user_templates', JSON.stringify(savedTemplates))
}
```

Display in UI alongside built-in templates.

---

## Contributing Templates

Want to add a template to the main repo?

1. **Check if it's unique** — avoid duplicates
2. **Write the template** (follow guidelines above)
3. **Add tests**
4. **Open a PR** with:
   - Template code
   - Tests
   - Example usage
   - Screenshot (if UI-related)

**Template approval criteria:**
- ✅ Clear use case
- ✅ Professional language
- ✅ Correct placeholders
- ✅ Passes tests
- ✅ No legal issues (consult a lawyer for legal templates)

---

## Resources

- **Template Engine Code:** `src/utils/templateEngine.ts`
- **Template Definitions:** `src/config/templates.ts`
- **Template Tests:** `src/config/templates.test.ts`
- **UI Component:** `src/components/MessageComposer.tsx`

---

Happy templating! 📝
