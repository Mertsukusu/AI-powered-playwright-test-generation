const axios = require('axios');

async function testDynamicGeneration() {
  const testCases = [
    {
      url: 'https://stackoverflow.com',
      projectName: 'StackOverflow Test Suite',
      scenarios: 7
    },
    {
      url: 'https://github.com',
      projectName: 'GitHub Test Suite', 
      scenarios: 5
    },
    {
      url: 'https://google.com',
      projectName: 'Google Test Suite',
      scenarios: 3
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.url} with ${testCase.scenarios} scenarios`);
    
    try {
      // Create a test run
      const response = await axios.post('http://localhost:8000/api/runs/', {
        project_url: testCase.url,
        project_name: testCase.projectName,
        scenarios_count: testCase.scenarios
      });

      console.log(`✅ Created run: ${response.data.id}`);
      console.log(`📊 Status: ${response.data.status}`);
      console.log(`🎯 Scenarios requested: ${testCase.scenarios}`);
      
      // Wait a bit and check results
      setTimeout(async () => {
        try {
          const runResponse = await axios.get(`http://localhost:8000/api/runs/${response.data.id}/`);
          const run = runResponse.data;
          
          console.log(`📈 Final status: ${run.status}`);
          console.log(`📝 Scenarios generated: ${run.scenarios?.length || 0}`);
          console.log(`🏗️ Page objects generated: ${run.page_objects?.length || 0}`);
          console.log(`📁 Artifacts created: ${run.artifacts?.length || 0}`);
          
          if (run.scenarios && run.scenarios.length !== testCase.scenarios) {
            console.log(`❌ ERROR: Expected ${testCase.scenarios} scenarios, got ${run.scenarios.length}`);
          } else {
            console.log(`✅ SUCCESS: Correct number of scenarios generated`);
          }
          
          if (run.page_objects && run.page_objects.length > 0) {
            console.log(`✅ SUCCESS: Page objects generated for ${testCase.url}`);
          } else {
            console.log(`❌ ERROR: No page objects generated`);
          }
          
        } catch (error) {
          console.log(`❌ Error checking results: ${error.message}`);
        }
      }, 10000); // Wait 10 seconds
      
    } catch (error) {
      console.log(`❌ Error creating test: ${error.message}`);
    }
  }
}

// Run the test
testDynamicGeneration().catch(console.error);
