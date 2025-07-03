export async function extractPdfText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/files/extract-pdf', {
    method: 'POST',
    body: formData,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Server returned an invalid or empty response. Check backend logs.');
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Failed to extract PDF');
  }

  return data.text;
} 