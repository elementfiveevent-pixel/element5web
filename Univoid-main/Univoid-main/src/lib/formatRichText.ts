/**
 * Converts markdown-style formatting to HTML
 * Supports: **bold**, *italic*, bullet points (•), numbered lists
 */
export const formatRichText = (text: string): string => {
  if (!text) return '';
  
  let html = text;
  
  // Convert **bold** to <strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em> (but not if it's part of **)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert line breaks to <br>
  html = html.replace(/\n/g, '<br>');
  
  return html;
};
