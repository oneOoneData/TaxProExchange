import { checkUrl } from "@/lib/linkChecker";

// Test the link checker with one of the URLs from the events
async function testLinkValidation() {
  console.log("Testing link validation...");
  
  const testUrls = [
    "https://www.nationaltaxconference.com",
    "https://www.irs.gov/webinars/understanding-tax-credits",
    "https://www.calcpa.org/annualmeeting",
    "https://www.drakesoftware.com/roadshow"
  ];

  for (const url of testUrls) {
    try {
      console.log(`\nTesting: ${url}`);
      const result = await checkUrl(url, ["tax", "conference"]);
      console.log(`Status: ${result.status}`);
      console.log(`Score: ${result.score}`);
      console.log(`Publishable: ${result.score >= 70}`);
      console.log(`Title: ${result.title || 'No title found'}`);
      console.log(`Canonical: ${result.canonical || 'No canonical'}`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`Failed to test ${url}:`, error);
    }
  }
}

testLinkValidation().catch(console.error);
