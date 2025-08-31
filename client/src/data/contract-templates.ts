// Contract templates for Australian and New Zealand tradies

export const contractTemplates = {
  Australia: {
    basicTradeContract: `
# Trade Service Agreement

**Service Provider:** [Your Business Name]
**ABN:** [Your ABN]
**Address:** [Your Address]

**Client:** [Customer Name]
**Address:** [Customer Address]

## Scope of Work
[Detailed description of work to be performed]

## Payment Terms
- Total Cost: $[Amount] (including 10% GST)
- Payment Schedule: [e.g., 50% deposit, balance on completion]
- Payment Methods: [Bank transfer, cash, etc.]

## Conditions
1. All work performed according to Australian Standards
2. Public Liability Insurance: $[Amount] (Certificate available)
3. WorkCover compliance maintained
4. All materials and labour guaranteed for [Period]

## Consumer Rights
This contract is subject to Australian Consumer Law. You have rights under the Competition and Consumer Act 2010.

**Signature:** _________________ Date: _________________
**Print Name:** [Your Name]

**Client Signature:** _________________ Date: _________________
**Print Name:** [Customer Name]
    `,
    
    quoteTemplate: `
# Quote for Trade Services

**Business:** [Your Business Name]
**ABN:** [Your ABN]
**Date:** [Current Date]

**Customer:** [Customer Name]
**Address:** [Job Address]

## Work Description
[Detailed scope of work]

## Pricing
- Labour: $[Amount]
- Materials: $[Amount]
- Subtotal: $[Amount]
- GST (10%): $[Amount]
- **Total: $[Amount]**

## Terms
- Quote valid for 30 days
- Payment terms: [Terms]
- Start date: [Expected start]
- Completion: [Expected completion]

This quote complies with Australian Consumer Law requirements.
    `
  },

  "New Zealand": {
    basicTradeContract: `
# Trade Service Agreement

**Service Provider:** [Your Business Name]
**NZBN:** [Your NZBN] (if applicable)
**Address:** [Your Address]

**Client:** [Customer Name]
**Address:** [Customer Address]

## Scope of Work
[Detailed description of work to be performed]

## Payment Terms
- Total Cost: $[Amount] NZD (including 15% GST)
- Payment Schedule: [e.g., 50% deposit, balance on completion]
- Payment Methods: [Bank transfer, cash, etc.]

## Conditions
1. All work performed according to New Zealand Building Code
2. Public Liability Insurance: $[Amount] (Certificate available)
3. ACC levy compliance maintained
4. All materials and labour guaranteed for [Period]

## Consumer Rights
This contract is subject to the Consumer Guarantees Act 1993 and Fair Trading Act 1986.

**Signature:** _________________ Date: _________________
**Print Name:** [Your Name]

**Client Signature:** _________________ Date: _________________
**Print Name:** [Customer Name]
    `,
    
    quoteTemplate: `
# Quote for Trade Services

**Business:** [Your Business Name]
**NZBN:** [Your NZBN] (if applicable)
**Date:** [Current Date]

**Customer:** [Customer Name]
**Address:** [Job Address]

## Work Description
[Detailed scope of work]

## Pricing
- Labour: $[Amount] NZD
- Materials: $[Amount] NZD
- Subtotal: $[Amount] NZD
- GST (15%): $[Amount] NZD
- **Total: $[Amount] NZD**

## Terms
- Quote valid for 30 days
- Payment terms: [Terms]
- Start date: [Expected start]
- Completion: [Expected completion]

This quote complies with New Zealand Consumer Guarantees Act requirements.
    `
  }
};

export function getContractTemplate(country: string, templateType: keyof typeof contractTemplates.Australia) {
  const templates = contractTemplates[country as keyof typeof contractTemplates];
  return templates?.[templateType] || contractTemplates.Australia[templateType];
}