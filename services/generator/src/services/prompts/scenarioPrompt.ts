export const scenarioPrompt = (
  crawlResults: any[], 
  pageObjects: any[], 
  count: number,
  websiteUrl: string
): string => {
  // Ensure exact count: 60% positive, 40% negative
  const positiveCount = Math.ceil(count * 0.6);
  const negativeCount = count - positiveCount;
  
  // Validate counts
  const totalCount = positiveCount + negativeCount;
  if (totalCount !== count) {
    throw new Error(`Scenario count mismatch: requested ${count}, calculated ${totalCount}`);
  }

  const pagesSummary = crawlResults.map(result => {
    return `
Page: ${result.url}
Title: ${result.title}
Available Actions: ${result.elements.slice(0, 10).map(el => el.text || el.placeholder || el.tag).join(', ')}
    `.trim();
  }).join('\n\n');

  const pomMethods = pageObjects.map(pom => 
    `${pom.className}: ${pom.methods.map(m => m.name).join(', ')}`
  ).join('\n');

  return `
Generate EXACTLY ${count} test scenarios for the following website. Create EXACTLY ${positiveCount} positive scenarios and EXACTLY ${negativeCount} negative scenarios.

Website URL: ${websiteUrl}
Website Pages:
${pagesSummary}

Available POM Methods:
${pomMethods}

Positive scenarios should cover:
- Happy path user workflows based on the actual website functionality
- Successful form submissions and data entry
- Navigation flows between pages
- Data validation success cases
- User interactions that work as expected

Negative scenarios should cover:
- Invalid form inputs and edge cases
- Authentication failures and access control
- Missing required fields and validation errors
- Network errors and timeouts
- Access denied cases and permission issues
- Boundary testing and invalid data

Each scenario should be:
- Realistic and based on actual website functionality
- Testable with the provided POM methods
- Specific to the website's features and user flows
- Include proper assertions and error handling

IMPORTANT: You must return EXACTLY ${count} scenarios total:
- EXACTLY ${positiveCount} positive scenarios
- EXACTLY ${negativeCount} negative scenarios

Return as JSON:
{
  "scenarios": [
    {
      "name": "string",
      "description": "string", 
      "type": "positive" | "negative",
      "steps": [
        {
          "description": "string",
          "action": "string",
          "expectedResult": "string"
        }
      ]
    }
  ]
}
  `.trim();
};
