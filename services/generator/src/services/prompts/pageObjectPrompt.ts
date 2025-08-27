export const pageObjectPrompt = (crawlResults: any[], websiteUrl: string): string => {
  const pagesSummary = crawlResults.map(result => {
    const elements = result.elements.slice(0, 20); // Limit to top 20 elements
    const forms = result.forms;
    
    return `
Page: ${result.url}
Title: ${result.title}
Key Elements: ${elements.map(el => `${el.tag}(${el.locator})`).join(', ')}
Forms: ${forms.length} forms found
    `.trim();
  }).join('\n\n');

  return `
Generate Page Object Model classes for the following website pages. Each POM should:
- Have a descriptive class name based on the page purpose and functionality
- Include methods for all major user interactions found on the page
- Use the provided Playwright locators with getByRole, getByLabel, or getByPlaceholder when possible
- Follow semantic naming conventions (e.g., login(), search(query), addToCart(product))
- Include proper TypeScript types and error handling
- Use stable selectors that won't break with UI changes

Website URL: ${websiteUrl}
Website Analysis:
${pagesSummary}

Generate exactly ${crawlResults.length} Page Object Model classes. Return as JSON:
{
  "pageObjects": [
    {
      "className": "string",
      "url": "string", 
      "methods": [
        {
          "name": "string",
          "description": "string",
          "parameters": [
            {
              "name": "string",
              "type": "string", 
              "description": "string"
            }
          ],
          "code": "string"
        }
      ]
    }
  ]
}
  `.trim();
};
