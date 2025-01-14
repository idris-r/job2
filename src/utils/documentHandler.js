import mammoth from 'mammoth';

export class DocumentHandler {
  static originalDocument = null;
  static originalParagraphs = [];
  static isOfficeInitialized = false;

  static async extractText(file) {
    const fileType = file.name.split('.').pop().toLowerCase();
    
    try {
      switch (fileType) {
        case 'docx':
          return await this.handleDocx(file);
        case 'txt':
          return await this.handleTxt(file);
        default:
          throw new Error('Please upload a .docx or .txt file');
      }
    } catch (error) {
      throw new Error(`Error processing file: ${error.message}`);
    }
  }

  static async handleDocx(file) {
    try {
      // Store the original file
      this.originalDocument = file;
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract raw text for editing
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      
      // Extract HTML to preserve structure
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      
      // Store original paragraphs with their positions
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlResult.value, 'text/html');
      this.originalParagraphs = Array.from(doc.body.children).map((p, index) => ({
        text: p.textContent,
        html: p.outerHTML,
        index,
        startPosition: textResult.value.indexOf(p.textContent)
      }));

      return {
        text: textResult.value,
        originalFile: file,
        paragraphs: this.originalParagraphs
      };
    } catch (error) {
      console.error('DOCX processing error:', error);
      throw new Error('Error processing DOCX file');
    }
  }

  static async handleTxt(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const paragraphs = text.split('\n').map((p, index) => ({
          text: p,
          html: `<p>${p}</p>`,
          index,
          startPosition: text.indexOf(p)
        }));
        this.originalParagraphs = paragraphs;
        resolve({
          text,
          originalFile: file,
          paragraphs
        });
      };
      reader.onerror = (e) => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }

  static async initializeOffice() {
    if (this.isOfficeInitialized) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://appsforoffice.microsoft.com/lib/1/hosted/office.js';
      script.onload = async () => {
        try {
          // Wait for Office to initialize
          await new Promise((resolve) => {
            if (window.Office) {
              Office.onReady(() => resolve());
            } else {
              reject(new Error('Office.js failed to load'));
            }
          });
          
          this.isOfficeInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => reject(new Error('Failed to load Office.js'));
      document.head.appendChild(script);
    });
  }

  static async automateDocumentChanges(improvements) {
    if (!this.originalDocument) {
      throw new Error('No original document found');
    }

    try {
      // Initialize Office.js
      await this.initializeOffice();

      // Create a URL for the original document
      const fileUrl = URL.createObjectURL(this.originalDocument);

      // Try to open the document in Office Online
      await Word.run(async (context) => {
        // Open the document
        const document = context.application.createDocument(fileUrl);
        await context.sync();

        // Apply each improvement
        for (const improvement of improvements) {
          // Search for the original text
          let searchResults = document.body.search(improvement.original);
          context.load(searchResults);
          await context.sync();

          // Replace with improved text
          searchResults.items.forEach(result => {
            result.insertText(improvement.improved, 'Replace');
          });
          await context.sync();
        }

        // Save the document
        document.save();
        await context.sync();
      });

      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error('Automation error:', error);
      throw new Error('Automated updates failed. Falling back to manual mode...');
    }
  }

  static async openAndEditDocument(improvements) {
    if (!this.originalDocument) {
      throw new Error('No original document found');
    }

    try {
      // Create a copy of the original file
      const fileContent = await this.originalDocument.arrayBuffer();
      const blob = new Blob([fileContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Create a URL for the file
      const fileUrl = URL.createObjectURL(blob);
      
      // Create a message with instructions
      const instructions = improvements.map((imp, index) => `
        Change ${index + 1}:
        Find: "${imp.original}"
        Replace with: "${imp.improved}"
      `).join('\n');
      
      // Create a modal with instructions
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 80%;
        max-height: 80vh;
        overflow-y: auto;
        color: black;
      `;
      
      modal.innerHTML = `
        <h3 style="margin-bottom: 15px; color: #1a1a1a;">Instructions for Document Updates</h3>
        <p style="margin-bottom: 15px; color: #4a5568;">Your document will open in a new tab. Please make the following changes:</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 15px; white-space: pre-wrap; color: #2d3748;">${instructions}</pre>
        <button id="openDoc" style="background: #4F46E5; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Open Document</button>
        <button id="closeModal" style="background: #6B7280; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
      `;

      // Add overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999;
      `;

      document.body.appendChild(overlay);
      document.body.appendChild(modal);

      // Add event listeners
      document.getElementById('openDoc').addEventListener('click', () => {
        window.open(fileUrl, '_blank');
      });

      const closeModal = () => {
        document.body.removeChild(modal);
        document.body.removeChild(overlay);
        URL.revokeObjectURL(fileUrl);
      };

      document.getElementById('closeModal').addEventListener('click', closeModal);
      overlay.addEventListener('click', closeModal);

    } catch (error) {
      console.error('Error opening document:', error);
      throw new Error('Error opening document for editing');
    }
  }

  static findParagraphForText(text) {
    // Find the paragraph that contains the exact text or the closest match
    return this.originalParagraphs.find(p => 
      p.text.includes(text) || text.includes(p.text)
    );
  }

  static async downloadModifiedDocument(content, filename = 'optimized-cv.docx') {
    try {
      const blob = new Blob([content], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error('Error saving the modified document');
    }
  }
}
