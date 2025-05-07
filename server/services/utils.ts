/**
 * Helper function to extract the page ID from a Notion URL
 * This supports multiple Notion URL formats:
 * - https://www.notion.so/{workspace}/{page-title}-{id}
 * - https://www.notion.so/{id}
 * - https://www.notion.so/{id}?pvs=4
 */
export function extractPageIdFromUrl(pageUrl: string): string {
  // Try to match the standard 32-character UUID pattern
  let match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  
  // If not found, look for UUID with dashes
  if (!match) {
    match = pageUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:[?#]|$)/i);
  }
  
  // Try other patterns that might appear in Notion URLs
  if (!match) {
    // Extract the last path segment
    const segments = pageUrl.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    // If it contains a hyphen, extract the part after the last hyphen
    if (lastSegment && lastSegment.includes('-')) {
      const parts = lastSegment.split('-');
      const potentialId = parts[parts.length - 1].split('?')[0]; // Remove query params
      
      // Check if it's a valid ID (at least 32 chars of hex)
      if (/^[a-f0-9]{32,}$/i.test(potentialId)) {
        return potentialId;
      }
    }
  }
  
  if (match && match[1]) {
    // Remove any dashes from the ID if present
    return match[1].replace(/-/g, '');
  }
  
  console.error("Failed to extract page ID from Notion URL:", pageUrl);
  throw Error("Failed to extract page ID from Notion URL: " + pageUrl);
}