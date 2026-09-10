import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const exportElementToPDF = async (
  elementId: string, 
  filename: string = 'report.pdf',
  orientation: 'p' | 'l' = 'p'
) => {
  let element = document.getElementById(elementId);
  if (!element) {
    // Attempt fallback lookups
    element = document.querySelector(`[id*="${elementId}"]`) || 
              document.querySelector(`.${elementId}`) ||
              document.querySelector('main');
  }

  if (!element) {
    console.warn(`Element with id "${elementId}" not found`);
    return;
  }

  // Temporarily add a class or style if needed to make the element print-friendly
  const originalBackground = element.style.background;
  element.style.background = 'white'; // Ensure background is white for PDF

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // Calculate PDF dimensions
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;
    
    // Add image to PDF
    pdf.addImage(imgData, 'JPEG', 0, 0, finalWidth, finalHeight);
    
    // Save the PDF
    pdf.save(filename);
  } catch (err) {
    console.error('Error generating PDF:', err);
  } finally {
    // Restore original background
    element.style.background = originalBackground;
  }
};
