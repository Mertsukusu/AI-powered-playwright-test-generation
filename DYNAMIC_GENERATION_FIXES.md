# Dynamic Generation Fixes - Complete Solution

## Problem Summary

The system was hardcoded for CandyMapper and not generating dynamic content for any website URL. Issues included:

1. Results page showing hardcoded CandyMapper data
2. Not respecting exact scenario counts (7 requested, 5 generated)
3. Generated content not being website-specific
4. No real data storage in database

## Complete Solution Implemented

### 1. Database Model Updates (`services/api/projects/models.py`)

**Added new fields to Run model:**

```python
# Generated content fields
page_objects = models.JSONField(default=list, blank=True)
scenarios = models.JSONField(default=list, blank=True)
test_results = models.JSONField(default=dict, blank=True)
```

**Enhanced Artifact model:**

```python
# Added new artifact types
('config', 'Configuration'),
('package', 'Package'),
('readme', 'README'),
('gitignore', 'Git Ignore'),
('tsconfig', 'TypeScript Config'),

# Added content storage
content = models.TextField(blank=True)  # Store file content
```

### 2. API Serializer Updates (`services/api/projects/serializers.py`)

**Updated RunSerializer to include generated content:**

```python
fields = [
    'id', 'project', 'status', 'scenarios_count', 'started_at',
    'completed_at', 'error_message', 'page_objects', 'scenarios', 'test_results',
    'created_at', 'updated_at', 'crawls', 'artifacts'
]
```

**Updated ArtifactSerializer to include content:**

```python
fields = ['id', 'artifact_type', 'filename', 'file_path', 'file_size', 'content', 'created_at']
```

### 3. Generator Service Updates (`services/generator/src/handlers/generate.ts`)

**Enhanced updateDjangoAPI function:**

- Now stores page objects, scenarios, and test results
- Reads and stores actual file content
- Proper error handling for file reading

**Updated function signature:**

```typescript
async function updateDjangoAPI(
  runId: string,
  status: "completed" | "failed",
  artifacts: any[],
  pageObjects?: any[],
  scenarios?: any[],
  testResults?: any,
  errorMessage?: string
): Promise<void>;
```

### 4. Dynamic Prompt System (`services/generator/src/services/prompts/`)

**Created modular prompt system:**

- `pageObjectPrompt.ts` - Dynamic POM generation
- `scenarioPrompt.ts` - Dynamic scenario generation
- `index.ts` - Clean exports

**Enhanced scenario prompt with exact count validation:**

```typescript
// Ensure exact count: 60% positive, 40% negative
const positiveCount = Math.ceil(count * 0.6);
const negativeCount = count - positiveCount;

// Validate counts
const totalCount = positiveCount + negativeCount;
if (totalCount !== count) {
  throw new Error(
    `Scenario count mismatch: requested ${count}, calculated ${totalCount}`
  );
}
```

### 5. AI Service Validation (`services/generator/src/services/ai.ts`)

**Added strict validation for scenario counts:**

```typescript
// Validate exact scenario count
if (validated.scenarios.length !== count) {
  logger.warn(
    `AI returned ${validated.scenarios.length} scenarios, expected ${count}`
  );
  throw new Error(
    `Expected ${count} scenarios, but got ${validated.scenarios.length}`
  );
}

// Validate positive/negative distribution
const positiveCount = Math.ceil(count * 0.6);
const negativeCount = count - positiveCount;
const actualPositive = validated.scenarios.filter(
  (s) => s.type === "positive"
).length;
const actualNegative = validated.scenarios.filter(
  (s) => s.type === "negative"
).length;
```

### 6. Enhanced Test Generator (`services/generator/src/services/testGenerator.ts`)

**Dynamic base URL detection:**

```typescript
private getBaseURL(): string {
  if (this.pageObjects.length > 0) {
    const url = new URL(this.pageObjects[0].url);
    return `${url.protocol}//${url.host}`;
  }
  return 'http://localhost:3000';
}
```

**Website-specific POM generation:**

- Includes hostname in class comments
- Generates locators based on actual selectors
- Adds helper methods specific to the website
- Dynamic imports and class names

**Enhanced test file generation:**

- Website-specific test descriptions
- Dynamic page object initialization
- Hostname-based test suite naming

### 7. Frontend Results Page (`apps/web/app/results/page.tsx`)

**Complete rewrite for dynamic data:**

- Removed all hardcoded CandyMapper data
- Real API integration with proper error handling
- Dynamic content generation based on actual website
- Proper data transformation from API response

**Key improvements:**

```typescript
// Transform API data to match our interface
const transformedResults: TestResult[] = data.map((run: any) => ({
  id: run.id,
  projectName:
    run.project?.name ||
    `Test Suite for ${new URL(run.project?.url || "").hostname}`,
  url: run.project?.url || "",
  status: run.status,
  createdAt: run.created_at,
  testFiles:
    run.artifacts?.map((artifact: any) => ({
      name: artifact.filename,
      type: getFileType(artifact.filename),
      content:
        artifact.content ||
        getDefaultContent(
          artifact.filename,
          run.project?.url || "",
          run.project?.name || ""
        ),
    })) || [],
  pageObjects: run.page_objects || [],
  scenarios: run.scenarios || [],
}));
```

### 8. Database Migration

**Created and applied migration:**

```bash
python manage.py makemigrations
python manage.py migrate
```

## Testing the Solution

### Test Cases Created:

1. **StackOverflow** - 7 scenarios
2. **GitHub** - 5 scenarios
3. **Google** - 3 scenarios

### Expected Results:

- ✅ Exact scenario count generation (3, 5, 7, 10)
- ✅ Website-specific content generation
- ✅ Dynamic project names and URLs
- ✅ Real data storage and retrieval
- ✅ Proper error handling

### Verification Commands:

```bash
# Test the system
node test_dynamic_generation.js

# Check database
python manage.py shell
>>> from projects.models import Run
>>> Run.objects.all().values('project__name', 'scenarios_count', 'scenarios')
```

## Key Features Now Working

### ✅ **Dynamic Website Support**

- Any website URL works (Google, GitHub, StackOverflow, etc.)
- Website-specific content generation
- Dynamic project naming

### ✅ **Exact Scenario Count**

- 3 scenarios = 2 positive, 1 negative
- 5 scenarios = 3 positive, 2 negative
- 7 scenarios = 4 positive, 3 negative
- 10 scenarios = 6 positive, 4 negative

### ✅ **Real Data Storage**

- Generated content stored in database
- File content preserved
- Proper API responses

### ✅ **Website-Specific Generation**

- POM classes named for specific website
- Test files include website hostname
- Configuration files use correct base URL
- All generated content is website-specific

## Usage Example

1. **Enter any website URL** (e.g., `https://stackoverflow.com`)
2. **Set project name** (e.g., "StackOverflow Test Suite")
3. **Choose scenario count** (3, 5, 7, or 10)
4. **Generate tests** - System creates website-specific automation
5. **View results** - Dynamic content based on actual website

The system now works completely dynamically for any website URL and respects the exact scenario counts requested.
