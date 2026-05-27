/**
 * ResearchFlow OS - AI Helper Client
 * Interacts directly with user-configured LLM provider (OpenAI, DeepSeek)
 * using their personal API keys stored safely inside local settings.
 */

class AICopilotClient {
  /**
   * Generates a request to the configured LLM API
   */
  async generateCompletion(prompt, systemPrompt = "You are a helpful academic AI research assistant.", jsonMode = false) {
    const db = await window.storage.loadAll();
    const config = db.settings?.ai || {
      provider: 'openai',
      apiKey: '',
      endpoint: 'https://api.openai.com/v1',
      model: 'gpt-4o'
    };

    if (!config.apiKey) {
      throw new Error('LLM API key is missing. Please configure it in Settings.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    };

    const requestBody = {
      model: config.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    };

    if (jsonMode) {
      // Support structured JSON responses
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${config.endpoint}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `AI API returned status ${response.status}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || '';
  }

  /**
   * Summarizes academic papers
   */
  async summarizePaper(title, abstract, fullText = '') {
    const systemPrompt = "You are a professional academic peer reviewer and domain expert. Summarize the provided academic paper context concisely.";
    const prompt = `
      Paper Title: ${title}
      Abstract: ${abstract}
      ${fullText ? `Selected Context: ${fullText}` : ''}
      
      Please generate:
      1. A one-sentence high-level breakthrough summary.
      2. 3 core key contributions (bullet points).
      3. 2 potential weaknesses or aspects to look out for.
      
      Format your response beautifully in standard Markdown. Keep it concise.
    `;
    return await this.generateCompletion(prompt, systemPrompt);
  }

  /**
   * Generates Draft Response for Reviewer Comments
   */
  async generateReviewResponse(comment, recordMethodology = '', manuscriptAbstract = '') {
    const systemPrompt = "You are an expert academic author crafting a rebuttal letter. Maintain a polite, professional, and confident tone. Format in markdown.";
    const prompt = `
      Reviewer Comment:
      "${comment}"
      
      Context from our Research Records:
      "${recordMethodology}"
      
      Manuscript Abstract Context:
      "${manuscriptAbstract}"
      
      Generate a professional, structured draft response for a rebuttal matrix.
      Include:
      1. A polite acknowledgment of the reviewer's point (e.g. "We thank the reviewer for this insightful comment...").
      2. A clear, scientifically-sound answer explaining what we did/revised, referencing the research records.
      3. A clear description of the specific changes made in the manuscript draft.
    `;
    return await this.generateCompletion(prompt, systemPrompt);
  }

  /**
   * Compiles an achievement into a concise academic CV bullet point
   */
  async generateCVEntry(itemType, itemDetails) {
    const systemPrompt = "You are an academic CV compiler. Format achievement data into crisp, impact-driven bullet points for academic curricula vitae.";
    const prompt = `
      Achievement Type: ${itemType}
      Item Details: ${JSON.stringify(itemDetails)}
      
      Generate two professional CV entries in standard academic styling:
      - Option A: For a chronological Academic CV (focusing on formal citations or titles).
      - Option B: For an Impact/Resume-style CV (starting with strong action verbs like "Pioneered", "Demonstrated", "Analyzed").
    `;
    return await this.generateCompletion(prompt, systemPrompt);
  }

  /**
   * Uses AI as a fallback to extract metadata from rich copied page texts
   */
  async extractMetadataFromText(rawText) {
    const systemPrompt = "You are a scholarly database scraper. Extract structured metadata from the raw text provided. Respond ONLY in valid JSON matching the schema.";
    const prompt = `
      Raw Text:
      """
      ${rawText.slice(0, 4000)}
      """
      
      Extract and respond ONLY with this JSON schema:
      {
        "title": "Clean Title of the paper",
        "doi": "Clean DOI format (e.g. 10.1038/s41586-024-xxxx-x) or empty string",
        "authors": ["Author 1", "Author 2"],
        "abstract": "Consolidated paper abstract or summary",
        "journal": "Journal name or Conference, or arXiv",
        "pubDate": "Year or Date string"
      }
    `;
    const responseText = await this.generateCompletion(prompt, systemPrompt, true);
    return JSON.parse(responseText);
  }
}

const aiCopilot = new AICopilotClient();
window.aiCopilot = aiCopilot;
