export interface GenerateRequest {
  projectId?: string;
  runId: string;
  url: string;
  scenarios: number;
}

export interface CrawlResult {
  url: string;
  title: string;
  elements: ElementInfo[];
  forms: FormInfo[];
  links: LinkInfo[];
}

export interface ElementInfo {
  tag: string;
  text?: string;
  role?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  alt?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  href?: string;
  type?: string;
  value?: string;
  selector: string;
  locator: string;
  priority: number;
}

export interface FormInfo {
  action?: string;
  method?: string;
  inputs: FormInput[];
}

export interface FormInput {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  label?: string;
}

export interface LinkInfo {
  text: string;
  href: string;
  isInternal: boolean;
}

export interface PageObjectModel {
  className: string;
  url: string;
  methods: POMethod[];
}

export interface POMethod {
  name: string;
  description: string;
  parameters: POMethodParameter[];
  code: string;
}

export interface POMethodParameter {
  name: string;
  type: string;
  description: string;
}

export interface TestScenario {
  name: string;
  description: string;
  type: 'positive' | 'negative';
  steps: TestStep[];
}

export interface TestStep {
  description: string;
  action: string;
  expectedResult: string;
}

export interface GenerationResult {
  projectId: string;
  runId: string;
  status: 'completed' | 'failed';
  pageObjects: PageObjectModel[];
  scenarios: TestScenario[];
  artifacts: ArtifactInfo[];
  error?: string;
}

export interface ArtifactInfo {
  type: 'pom' | 'test' | 'screenshot' | 'video' | 'log' | 'junit' | 'summary';
  filename: string;
  filePath: string;
  fileSize: number;
}

export interface TestResult {
  passed: number;
  failed: number;
  total: number;
  details: TestDetail[];
}

export interface TestDetail {
  name: string;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
  screenshot?: string;
  video?: string;
}
