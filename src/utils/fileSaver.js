export const saveAsPDF = (content, filename = 'optimized-cv.pdf') => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Split content into pages
  const lines = doc.splitTextToSize(content, 180);
  
  doc.setFontSize(12);
  doc.text(lines, 10, 10);
  doc.save(filename);
};

export const saveAsDOC = (content, filename = 'optimized-cv.doc') => {
  const blob = new Blob([content], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
