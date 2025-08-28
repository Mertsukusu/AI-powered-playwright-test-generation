# AI-Powered Playwright Test Generator

An intelligent test generation platform that uses AI to automatically create comprehensive Playwright tests for web applications. The system analyzes web pages, generates test scenarios, and produces production-ready test code with page object models.

## 🎬 Demo Video

<video src="assets/demo.mp4" controls width="800" muted playsinline>
  Check Demo video!
</video>

_Watch the complete demonstration of AI-powered test generation in action!_

## 📸 Application Screenshots

### 🏠 Main Screeb - Test Generation Interface

_Modern and intuitive interface for configuring AI-powered test generation_

### 📊 Test Results - Generated Test Results

_Comprehensive test results with downloadable Playwright test suites and Page Object Models_

## Features

- 🤖 **AI-Powered Analysis**: Intelligent web page analysis using OpenAI GPT models
- 🎭 **Playwright Integration**: Automated test generation for Playwright framework
- 📱 **Modern UI**: Clean, responsive React/Next.js interface
- 🐳 **Docker Support**: Containerized services for easy deployment
- 🔄 **Real-time Processing**: Live status updates during test generation
- 📋 **Page Object Model**: Generates maintainable POM structure
- 🎯 **Smart Scenarios**: Context-aware test scenario generation
- 📊 **Result Management**: Track and manage generated test suites

## Architecture

This project follows a microservices architecture with three main components:

### 1. Web App (`apps/web`)

- **Technology**: Next.js 14 with TypeScript
- **Purpose**: Frontend interface for test generation
- **Features**:
  - Test configuration forms
  - Real-time generation status
  - Result viewing and download
  - Responsive design with Tailwind CSS

### 2. API Service (`services/api`)

- **Technology**: Django REST Framework
- **Purpose**: Backend API and data management
- **Features**:
  - RESTful API endpoints
  - Test run management
  - Artifact storage
  - CORS configuration

### 3. Generator Service (`services/generator`)

- **Technology**: Node.js with TypeScript
- **Purpose**: AI-powered test generation engine
- **Features**:
  - Web page crawling and analysis
  - OpenAI integration for intelligent test creation
  - Playwright test code generation
  - Page object model creation

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- OpenAI API key

### Environment Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Mertsukusu/AI-powered-test-generator.git
   cd AI-powered-test-generator
   ```

2. **Environment Configuration**

   ```bash
   cp env.example .env
   ```

   Edit `.env` and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Docker Deployment (Recommended)

**Start all services:**

```bash
docker-compose up --build
```

**Access the application:**

- Web Interface: http://localhost:3000
- API Documentation: http://localhost:8000/admin
- Generator Service: http://localhost:3001/health

### Manual Development Setup

1. **Install dependencies**

   ```bash
   npm run install:all
   ```

2. **Start Django API**

   ```bash
   cd services/api
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver 8000
   ```

3. **Start Generator Service**

   ```bash
   cd services/generator
   npm install
   npm run dev
   ```

4. **Start Web App**
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

## Usage

1. **Access the Web Interface** at http://localhost:3000

2. **Enter Target URL** - Provide the web application URL to analyze

3. **Configure Settings**:

   - Project name
   - Number of test scenarios
   - Test complexity level

4. **Generate Tests** - Click "Generate Tests" and monitor progress

5. **Download Results** - Access generated test files and page object models

## API Endpoints

### API Service (Port 8000)

- `GET /api/runs/` - List all test runs
- `POST /api/runs/` - Create new test run
- `GET /api/runs/{id}/` - Get specific test run
- `GET /api/artifacts/` - List all artifacts

### Generator Service (Port 3001)

- `POST /generate` - Generate tests for URL
- `GET /status/{runId}` - Check generation status
- `GET /health` - Service health check

## Configuration

### Environment Variables

| Variable            | Description                    | Default        |
| ------------------- | ------------------------------ | -------------- |
| `OPENAI_API_KEY`    | OpenAI API key for AI features | Required       |
| `OPENAI_MODEL`      | OpenAI model to use            | `gpt-4`        |
| `DJANGO_SECRET_KEY` | Django secret key              | Auto-generated |
| `DJANGO_DEBUG`      | Enable Django debug mode       | `True`         |
| `MAX_SCENARIOS`     | Maximum test scenarios         | `10`           |
| `CRAWL_DELAY`       | Delay between page crawls (ms) | `1000`         |

### Service Configuration

Each service can be configured independently:

- **Web App**: `apps/web/next.config.js`
- **API**: `services/api/api/settings.py`
- **Generator**: `services/generator/src/index.ts`

## Generated Test Structure

The system generates comprehensive test suites including:

```
generated_tests/
├── pages/           # Page Object Models
│   ├── BasePage.ts
│   ├── HomePage.ts
│   └── ...
├── tests/           # Test specifications
│   ├── basic.spec.ts
│   ├── forms.spec.ts
│   └── ...
└── config/          # Test configuration
    ├── playwright.config.ts
    └── test-data.json
```

## Development

### Code Structure

```
├── apps/
│   └── web/                 # Next.js frontend
│       ├── app/            # App router pages
│       ├── components/     # React components
│       └── lib/           # Utilities
├── services/
│   ├── api/               # Django REST API
│   │   ├── api/          # Django settings
│   │   └── projects/     # Test run models
│   └── generator/         # Node.js generator
│       ├── src/
│       │   ├── handlers/ # Route handlers
│       │   ├── services/ # Core logic
│       │   └── types/    # TypeScript types
│       └── tests/        # Generated output
└── docker-compose.yml     # Container orchestration
```

### Available Scripts

- `npm run dev` - Start all services in development mode
- `npm run build` - Build production assets
- `npm run lint` - Run code linting
- `npm run format` - Format code
- `npm run typecheck` - TypeScript type checking

### Testing

Run tests for individual services:

```bash
# API tests
cd services/api && python manage.py test

# Generator tests
cd services/generator && npm test

# Web app tests
cd apps/web && npm test
```

## Troubleshooting

### Common Issues

1. **OpenAI API Key Issues**

   - Verify API key is set in `.env`
   - Check API key validity and credits

2. **Port Conflicts**

   - Ensure ports 3000, 8000, 3001 are available
   - Modify docker-compose.yml if needed

3. **Docker Issues**

   - Run `docker-compose down` and `docker-compose up --build`
   - Check Docker daemon is running

4. **Generation Failures**
   - Check generator service logs
   - Verify target URL is accessible
   - Ensure OpenAI model availability

### Logs

Access service logs:

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs generator
docker-compose logs api
docker-compose logs web
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Check existing documentation
- Review troubleshooting guide

---

Built with ❤️ for automated testing
