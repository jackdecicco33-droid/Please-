const state = {
  resources: [],
  services: [],
  sources: [],
  search: '',
  service: 'all',
  level: 'all',
  category: 'all',
  showResources: false,
  sourceSearch: ''
};

const els = {
  coverServiceDropdown: document.querySelector('#coverServiceDropdown'),
  coverEnterBtn: document.querySelector('#coverEnterBtn'),
  serviceLineGrid: document.querySelector('#serviceLineGrid'),
  resourceGrid: document.querySelector('#resourceGrid'),
  sourceGrid: document.querySelector('#sourceGrid'),
  searchInput: document.querySelector('#searchInput'),
  serviceFilter: document.querySelector('#serviceFilter'),
  levelFilter: document.querySelector('#levelFilter'),
  categoryFilter: document.querySelector('#categoryFilter'),
  sourceSearch: document.querySelector('#sourceSearch'),
  resetFilters: document.querySelector('#resetFilters'),
  resultsSummary: document.querySelector('#resultsSummary'),
  resourceCount: document.querySelector('#resourceCount'),
  sourceCount: document.querySelector('#sourceCount'),
  serviceCount: document.querySelector('#serviceCount')
};

const trustDescriptions = [
  { test: /cms\.gov|ahrq\.gov|bls\.gov|medicaid\.gov/i, label: 'Government / primary source', why: 'Official public-sector source for policy, data, regulations, or healthcare program guidance.' },
  { test: /hfma|aaham|aapc|ahrmm|ascm|ismworld|mgma|amga|nahq|ache|aha\.org|shrm|himss|acdis|ahima|nursingworld/i, label: 'Professional association', why: 'Used by healthcare, finance, operations, clinical, supply chain, or workforce professionals for education and field standards.' },
  { test: /coursera|edx|udemy|linkedin/i, label: 'Learning platform', why: 'Useful for self-paced learning and skill refreshers; validate course relevance against current role or project needs.' },
  { test: /beckers|modernhealthcare|healthcaredive|revcycleintelligence|hpnonline|fiercehealthcare/i, label: 'Industry media', why: 'Helpful for tracking market trends, executive priorities, provider news, and operational issues.' },
  { test: /gartner|advisory|kaufmanhall|mckinsey|deloitte|pwc|kpmg|ey/i, label: 'Research / consulting insight', why: 'Useful for market perspective, benchmarks, transformation themes, and executive-level framing.' },
  { test: /hlth|viveevent|jpmorgan|conference|events|webinars/i, label: 'Conference / forum', why: 'Useful for trend sensing, networking, executive topics, and current industry priorities.' },
  { test: /bookshop|amazon/i, label: 'Book / marketplace link', why: 'Useful for locating books; trust should be based on the author, publisher, and professional relevance.' }
];

function classifySource(source) {
  const target = `${source.url || ''} ${source.domain || ''} ${(source.resourceNames || []).join(' ')}`;
  return trustDescriptions.find(item => item.test.test(target)) || {
    label: 'Reference source',
    why: 'Useful as a directional resource; verify the specific page, author, and publication date before citing in client-facing work.'
  };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

const healthcareIndustryNews = [
  {
    title: "CMS policy and payment updates remain a key signal for provider strategy",
    source: "CMS Newsroom",
    date: "Update regularly",
    serviceLine: "Revenue Cycle / Quality",
    trustLevel: "Primary Source",
    summary:
      "CMS updates are important because payment policy, quality reporting, reimbursement rules, and value-based care programs can directly affect how hospitals operate and get paid.",
    consultingLens:
      "Revenue Cycle teams should watch for billing and reimbursement impact. Quality teams should watch for reporting and performance requirements. Strategy teams should watch for broader operating model implications.",
    url: "https://www.cms.gov/newsroom"
  },
  {
    title: "Hospital finance and margin pressure continue to shape executive priorities",
    source: "Becker’s Hospital Review",
    date: "Update regularly",
    serviceLine: "Revenue Cycle / Strategy",
    trustLevel: "Industry News",
    summary:
      "Hospital finance stories help users understand what executives are paying attention to, including cost pressure, reimbursement challenges, denials, labor expense, and revenue performance.",
    consultingLens:
      "Consultants should connect finance news back to cash acceleration, denial prevention, payer strategy, operating expense, and margin improvement opportunities.",
    url: "https://www.beckershospitalreview.com/finance.html"
  },
  {
    title: "Healthcare workforce trends remain central to hospital operations",
    source: "BLS Healthcare Occupations",
    date: "Update regularly",
    serviceLine: "Workforce / Labor",
    trustLevel: "Primary Data",
    summary:
      "Healthcare employment and wage data can help users understand labor-market pressure, staffing challenges, compensation trends, and workforce planning needs.",
    consultingLens:
      "Workforce consultants should watch wage pressure, role shortages, staffing mix, overtime reliance, turnover risk, and how labor constraints affect operations.",
    url: "https://www.bls.gov/ooh/healthcare/"
  },
  {
    title: "Healthcare quality and patient safety remain key performance priorities",
    source: "AHRQ",
    date: "Update regularly",
    serviceLine: "Quality / Clinical Optimization",
    trustLevel: "Primary Source",
    summary:
      "AHRQ resources help users understand patient safety, evidence-based improvement, care delivery research, and practical tools for quality performance.",
    consultingLens:
      "Quality consultants should connect safety and quality topics to readmissions, harm events, patient experience, process redesign, and performance improvement initiatives.",
    url: "https://www.ahrq.gov/"
  },
  {
    title: "Healthcare policy analysis helps explain Medicare, Medicaid, affordability, and coverage trends",
    source: "KFF",
    date: "Update regularly",
    serviceLine: "Policy / Strategy",
    trustLevel: "Policy Research",
    summary:
      "Policy analysis helps users understand the larger forces affecting health systems, including coverage, government programs, affordability, and access.",
    consultingLens:
      "Strategy and revenue cycle teams should translate policy movement into implications for payer mix, reimbursement, patient access, affordability, and health-system planning.",
    url: "https://www.kff.org/"
  }
];

let healthcareTerms = [];

function renderTerminologyDictionary() {
  const grid = document.getElementById("terminologyGrid");
  const searchInput = document.getElementById("termSearch");
  const serviceFilter = document.getElementById("serviceLineFilter");
  const countLabel = document.getElementById("dictionaryResultsCount");

  if (!grid || !searchInput || !serviceFilter || !countLabel) {
    return;
  }

  function hasExactTermMatch(searchValue) {
    return healthcareTerms.some((item) => item.term.toLowerCase() === searchValue);
  }

  function getFilteredTerms() {
    const searchValue = searchInput.value.toLowerCase().trim();
    const selectedServiceLine = serviceFilter.value;

    return healthcareTerms.filter((item) => {
      const matchesServiceLine =
        selectedServiceLine === "All" || item.serviceLine === selectedServiceLine;

      if (searchValue) {
        return matchesServiceLine && item.term.toLowerCase() === searchValue;
      }

      return matchesServiceLine;
    });
  }

  function shouldShowTerms() {
    const searchValue = searchInput.value.toLowerCase().trim();
    const selectedServiceLine = serviceFilter.value;

    if (selectedServiceLine !== "All") {
      return true;
    }

    if (!searchValue) {
      return false;
    }

    return hasExactTermMatch(searchValue);
  }

  function renderCards() {
    if (!shouldShowTerms()) {
      countLabel.textContent = "";
      grid.innerHTML = `
        <div class="no-terms-message">
          Select a service line to unlock terms, or enter the exact term name to look it up word for word.
        </div>
      `;
      return;
    }

    const filteredTerms = getFilteredTerms();
    const activeCount = filteredTerms.length;

    if (countLabel) {
      countLabel.textContent = `${activeCount} term${activeCount === 1 ? "" : "s"} shown`;
    }

    if (activeCount === 0) {
      grid.innerHTML = `
        <div class="no-terms-message">
          No exact term found. Try selecting a service line or typing the exact term name.
        </div>
      `;
      return;
    }

    grid.innerHTML = filteredTerms
      .map(
        (item) => `
          <article class="term-card">
            <div class="term-card-header">
              <span class="term-service-badge">${item.serviceLine}</span>
              <span class="term-level-badge">${item.level}</span>
            </div>

            <h3>${item.term}</h3>

            <div class="term-block">
              <strong>Definition</strong>
              <p>${item.definition}</p>
            </div>

            <div class="term-block term-example">
              <strong>Healthcare example</strong>
              <p>${item.example}</p>
            </div>

            <div class="term-block">
              <strong>Why it matters</strong>
              <p>${item.whyItMatters}</p>
            </div>

            ${item.relatedResources && item.relatedResources.length ? `
              <div class="term-block">
                <strong>Further reading</strong>
                <ul class="related-resources">
                  ${item.relatedResources
                    .map(
                      (resource) => `<li><a href="${resource.url}" target="_blank" rel="noopener noreferrer">${resource.label}</a></li>`
                    )
                    .join("")}
                </ul>
              </div>
            ` : ''}
          </article>
        `
      )
      .join("");
  }

  searchInput.addEventListener("input", renderCards);
  serviceFilter.addEventListener("change", renderCards);

  renderCards();
}

function getDailyNewsIndex() {
  const startDate = new Date("2026-01-01T00:00:00");
  const today = new Date();

  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const oneDay = 1000 * 60 * 60 * 24;
  const dayDifference = Math.floor((today - startDate) / oneDay);

  return Math.abs(dayDifference) % healthcareIndustryNews.length;
}

function renderHealthcareIndustryWatch() {
  const featuredNewsCard = document.getElementById("featuredNewsCard");
  const newsGrid = document.getElementById("newsGrid");
  const newsUpdatedLabel = document.getElementById("newsUpdatedLabel");

  if (!featuredNewsCard || !newsGrid) {
    return;
  }

  const todayIndex = getDailyNewsIndex();
  const featured = healthcareIndustryNews[todayIndex];

  const supportingArticles = healthcareIndustryNews
    .filter((_, index) => index !== todayIndex)
    .slice(0, 3);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  featuredNewsCard.innerHTML = `
    <div class="news-meta-row">
      <span class="news-pill green">${featured.trustLevel}</span>
      <span class="news-pill">${featured.serviceLine}</span>
      <span class="news-pill">${featured.source}</span>
    </div>

    <h3>${featured.title}</h3>

    <p class="news-summary">${featured.summary}</p>

    <div class="consulting-lens-box">
      <strong>Consulting lens</strong>
      <p>${featured.consultingLens}</p>
    </div>

    <div class="news-actions">
      <a class="news-button" href="${featured.url}" target="_blank" rel="noopener noreferrer">
        Read source →
      </a>
      <span class="news-source-text">Featured for ${formattedDate}</span>
    </div>
  `;

  newsGrid.innerHTML = supportingArticles
    .map(
      article => `
        <article class="mini-news-card">
          <span class="news-pill">${article.serviceLine}</span>
          <h4>${article.title}</h4>
          <p>${article.summary}</p>
          <a href="${article.url}" target="_blank" rel="noopener noreferrer">
            View source →
          </a>
        </article>
      `
    )
    .join("");

  if (newsUpdatedLabel) {
    newsUpdatedLabel.textContent = `Daily rotation shown for ${formattedDate}`;
  }
}

function normalize(value) {
  return String(value || '').toLowerCase();
}

function resourceMatches(resource) {
  const haystack = normalize([
    resource.name,
    resource.organization,
    resource.description,
    resource.serviceLine,
    resource.level,
    resource.category,
    resource.url
  ].join(' '));
  const matchesSearch = !state.search || haystack.includes(normalize(state.search));
  const matchesService = state.service === 'all' || resource.serviceLine === state.service;
  const matchesLevel = state.level === 'all' || resource.level === state.level;
  const matchesCategory = state.category === 'all' || resource.category === state.category;
  return matchesSearch && matchesService && matchesLevel && matchesCategory;
}

function sourceMatches(source) {
  const haystack = normalize([
    source.domain,
    source.url,
    ...(source.resourceNames || []),
    ...(source.serviceLines || []),
    ...(source.categories || [])
  ].join(' '));
  return !state.sourceSearch || haystack.includes(normalize(state.sourceSearch));
}

function populateFilter(select, values, allLabel) {
  select.innerHTML = `<option value="all">${allLabel}</option>` + values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
}

function renderServiceLines() {
  if (!els.serviceLineGrid) return;
  els.serviceLineGrid.innerHTML = state.services.map(service => `
    <article class="service-card" id="service-${service.id}">
      <h3>${escapeHtml(service.serviceLine)}</h3>
      <p>${escapeHtml(service.whatThisServiceLineDoes || service.description || '')}</p>
      <div class="pill-row">
        ${(service.focusPills || []).map(pill => `<span class="pill">${escapeHtml(pill)}</span>`).join('')}
      </div>
      <p class="small-label">What consultants look for</p>
      <ul class="mini-list">
        ${(service.consultantsLookFor || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </article>
  `).join('');
}

function renderResources() {
  if (!state.showResources) {
    els.resultsSummary.textContent = 'Resources are hidden. Select a category to reveal matching resources.';
    els.resourceGrid.innerHTML = '<div class="empty-state">Resources are hidden. Click a category below or select a category to reveal matching resources.</div>';
    return;
  }

  const results = state.resources.filter(resourceMatches);
  els.resultsSummary.textContent = `${results.length} resource${results.length === 1 ? '' : 's'} shown`;
  if (!results.length) {
    els.resourceGrid.innerHTML = '<div class="empty-state">No resources match those filters. Try resetting filters or using a broader keyword.</div>';
    return;
  }
  els.resourceGrid.innerHTML = results.map(resource => `
    <article class="resource-card">
      <div class="tag-stack">
        <span class="tag">${escapeHtml(resource.serviceLine)}</span>
        <span class="tag">${escapeHtml(resource.level)}</span>
      </div>
      <h3>${escapeHtml(resource.name)}</h3>
      <p class="resource-meta">${escapeHtml(resource.category)} · ${escapeHtml(resource.organization || 'Resource')}</p>
      <p class="resource-desc">${escapeHtml(resource.description || 'Use this source to build healthcare consulting domain fluency.')}</p>
      <a class="resource-link" href="${escapeAttribute(resource.url)}" target="_blank" rel="noopener">Open resource →</a>
    </article>
  `).join('');
}

function renderCategoryButtons() {
  const container = document.getElementById('categoryButtons');
  if (!container) return;
  const categories = uniqueSorted(state.resources.map(r => r.category)).filter(Boolean);
  container.innerHTML = categories.map(cat => `<button type="button" class="category-button" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`).join('');
  container.querySelectorAll('.category-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = e.currentTarget.getAttribute('data-cat');
      state.category = cat;
      state.showResources = true;
      // update select to reflect the chosen category
      if (els.categoryFilter) els.categoryFilter.value = cat;
      // mark active
      container.querySelectorAll('.category-button').forEach(b => b.classList.toggle('active', b === e.currentTarget));
      renderResources();
      document.querySelector('#resourceLibrary').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function renderSources() {
  const results = state.sources.filter(sourceMatches);
  if (!results.length) {
    els.sourceGrid.innerHTML = '<div class="empty-state">No sources match that search.</div>';
    return;
  }
  els.sourceGrid.innerHTML = results.map(source => {
    const trust = classifySource(source);
    const names = (source.resourceNames || []).slice(0, 4).join(', ');
    const lines = (source.serviceLines || []).slice(0, 4).join(', ');
    return `
      <article class="source-card">
        <p class="small-label">${escapeHtml(trust.label)}</p>
        <h3>${escapeHtml(source.domain || source.url)}</h3>
        <p>${escapeHtml(trust.why)}</p>
        <p><strong>Appears as:</strong> ${escapeHtml(names || 'Source link')}</p>
        <p><strong>Service lines:</strong> ${escapeHtml(lines || 'Shared')}</p>
        <a href="${escapeAttribute(source.url)}" target="_blank" rel="noopener">Visit source →</a>
      </article>
    `;
  }).join('');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function bindEvents() {
  if (els.coverEnterBtn) {
    els.coverEnterBtn.addEventListener('click', () => {
      const selectedService = els.coverServiceDropdown ? els.coverServiceDropdown.value : 'all';
      if (selectedService !== 'all') {
        state.service = selectedService;
        if (els.serviceFilter) els.serviceFilter.value = selectedService;
        // don't reveal resources until a category is selected
        renderResources();
        const el = document.querySelector('#resourceLibrary');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        const el = document.querySelector('#resourceLibrary');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (els.coverServiceDropdown) {
    els.coverServiceDropdown.addEventListener('keypress', event => {
      if (event.key === 'Enter' && els.coverEnterBtn) {
        els.coverEnterBtn.click();
      }
    });
  }

  els.searchInput.addEventListener('input', event => { state.search = event.target.value; renderResources(); });
  els.serviceFilter.addEventListener('change', event => { state.service = event.target.value; renderResources(); });
  els.levelFilter.addEventListener('change', event => { state.level = event.target.value; renderResources(); });
  els.categoryFilter.addEventListener('change', event => {
    state.category = event.target.value;
    state.showResources = state.category !== 'all';
    // update category button active state if present
    const container = document.getElementById('categoryButtons');
    if (container) {
      container.querySelectorAll('.category-button').forEach(b => b.classList.toggle('active', b.getAttribute('data-cat') === state.category));
    }
    renderResources();
  });
  els.sourceSearch.addEventListener('input', event => { state.sourceSearch = event.target.value; renderSources(); });
  els.resetFilters.addEventListener('click', () => {
    state.search = '';
    state.service = 'all';
    state.level = 'all';
    state.category = 'all';
    els.searchInput.value = '';
    els.serviceFilter.value = 'all';
    els.levelFilter.value = 'all';
    els.categoryFilter.value = 'all';
    state.showResources = false;
    renderResources();
  });
}

async function init() {
  const [resources, services, sources, terminology] = await Promise.all([
    fetchJson('./data/resources.json'),
    fetchJson('./data/service-lines.json'),
    fetchJson('./data/source-index.json'),
    fetchJson('./data/terminology.json')
  ]);
  state.resources = resources;
  state.services = services;
  state.sources = sources;
  healthcareTerms = terminology || [];

  const serviceLineNames = uniqueSorted(services.map(item => item.serviceLine));
  populateFilter(els.serviceFilter, serviceLineNames, 'All service lines');
  if (els.coverServiceDropdown) populateFilter(els.coverServiceDropdown, serviceLineNames, 'All service lines');
  populateFilter(els.levelFilter, uniqueSorted(resources.map(item => item.level)), 'All levels');
  populateFilter(els.categoryFilter, uniqueSorted(resources.map(item => item.category)), 'All categories');

  els.resourceCount.textContent = resources.length;
  els.sourceCount.textContent = sources.length;
  els.serviceCount.textContent = services.length;

  renderHealthcareIndustryWatch();
  renderServiceLines();
  renderSources();
  renderCategoryButtons();
  renderTerminologyDictionary();
  // initially hide resources until a category is chosen
  state.showResources = false;
  renderResources();
  bindEvents();
  loadInsights();
  bindInsightForm();

  // Auto-refresh insights every 5 seconds to catch new form submissions
  setInterval(() => {
    loadInsights();
  }, 5000);
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Required website data could not be loaded: ${url} (HTTP ${response.status})`);
  }

  return response.json();
}

function bindInsightForm() {
  const form = document.getElementById('insightForm');
  const successMessage = document.getElementById('insightSuccess');

  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const insight = {
      name: document.getElementById('insightName')?.value.trim(),
      role: document.getElementById('insightRole')?.value.trim(),
      sourceType: document.getElementById('insightSourceType')?.value.trim(),
      title: document.getElementById('insightTitle')?.value.trim(),
      link: document.getElementById('insightLink')?.value.trim(),
      rating: document.getElementById('insightRating')?.value.trim(),
      takeaways: document.getElementById('insightTakeaways')?.value.trim(),
      whyItMatters: document.getElementById('insightWhyItMatters')?.value.trim(),
      audience: document.getElementById('insightAudience')?.value.trim()
    };

    saveInsightLocally(insight);
    addInsightToPage(insight);

    form.reset();

    if (successMessage) {
      successMessage.textContent = '✓ Insight submitted and shown below.';
      setTimeout(() => {
        successMessage.textContent = '';
      }, 4000);
    }

    document.getElementById('employee-insights')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function saveInsightLocally(insight) {
  try {
    const stored = localStorage.getItem('localInsights');
    const insights = stored ? JSON.parse(stored) : [];
    insights.push(insight);
    localStorage.setItem('localInsights', JSON.stringify(insights));
  } catch (e) {
    console.warn('localStorage not available', e);
  }
}

function loadLocalInsights() {
  try {
    const stored = localStorage.getItem('localInsights');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('localStorage not available', e);
    return [];
  }
}

function addInsightToPage(insight) {
  const container = document.getElementById('insightsContainer');
  if (!container) return;

  const insightHtml = `
    <article class="insight-card">
      <span class="insight-tag">${escapeHtml(insight.sourceType || 'Insight')}</span>
      <h3>${escapeHtml(insight.title || 'Untitled Insight')}</h3>
      <p><strong>Reliability Rating:</strong> ${escapeHtml(insight.rating || 'Not rated')}</p>
      <p><strong>Submitted By:</strong> ${escapeHtml(insight.name || 'Anonymous')}</p>
      <p><strong>Role:</strong> ${escapeHtml(insight.role || 'Not provided')}</p>
      <p><strong>Key Takeaway:</strong> ${escapeHtml(insight.takeaways || 'No takeaway provided.')}</p>
      <p><strong>Why It Matters:</strong> ${escapeHtml(insight.whyItMatters || 'Not provided.')}</p>
      <p><strong>Best For:</strong> ${escapeHtml(insight.audience || 'General audience')}</p>
      ${insight.link ? `<a class="insight-link" href="${escapeAttribute(insight.link)}" target="_blank">View Source</a>` : ''}
    </article>
  `;

  if (container.innerHTML.trim() === '<p>No employee insights have been submitted yet.</p>' || container.innerHTML.trim() === '') {
    container.innerHTML = insightHtml;
  } else {
    container.insertAdjacentHTML('beforeend', insightHtml);
  }
}

async function loadInsights() {
  const container = document.getElementById("insightsContainer");
  const status = document.getElementById("insightsStatus");

  if (!container) return;

  try {
    let response = await fetch("/api/insights", { cache: "no-store" });
    let insights = [];
    const isJsonResponse = response.headers.get("content-type")?.includes("application/json");

    // Keep the page usable when it is running from Vite without the backend.
    if (!response.ok || !isJsonResponse) {
      response = await fetch(`insights.json?ts=${Date.now()}`, { cache: "no-store" });
    }

    if (response.ok) {
      insights = await response.json();
    }

    // Also load any local submissions
    const localInsights = loadLocalInsights();
    insights = [...insights, ...localInsights];

    if (!insights || insights.length === 0) {
      container.innerHTML = "<p>No employee insights have been submitted yet.</p>";
      if (status) status.textContent = "Live responses connected · no submissions yet";
      return;
    }

    insights.sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));

    container.innerHTML = insights
      .map((insight) => {
        return `
          <article class="insight-card">
            <span class="insight-tag">${escapeHtml(insight.sourceType || "Insight")}</span>
            <h3>${escapeHtml(insight.title || "Untitled Insight")}</h3>
            <p><strong>Reliability Rating:</strong> ${escapeHtml(insight.rating || "Not rated")}</p>
            <p><strong>Submitted By:</strong> ${escapeHtml(insight.name || "Anonymous")}</p>
            <p><strong>Role:</strong> ${escapeHtml(insight.role || "Not provided")}</p>
            <p><strong>Key Takeaway:</strong> ${escapeHtml(insight.takeaways || "No takeaway provided.")}</p>
            <p><strong>Why It Matters:</strong> ${escapeHtml(insight.whyItMatters || "Not provided.")}</p>
            <p><strong>Best For:</strong> ${escapeHtml(insight.audience || "General audience")}</p>
            ${
              insight.link
                ? `<a class="insight-link" href="${escapeAttribute(insight.link)}" target="_blank">View Source</a>`
                : ""
            }
          </article>
        `;
      })
      .join("");
    if (status) {
      const countLabel = insights.length === 1 ? "1 response" : `${insights.length} responses`;
      status.textContent = `Live responses connected · ${countLabel} · updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Unable to load employee insights right now.</p>";
    if (status) status.textContent = "Live responses are temporarily unavailable";
  }
}

init().catch(error => {
  console.error(error);
  document.body.insertAdjacentHTML(
    'afterbegin',
    '<div class="empty-state">The resource library data is missing from this deployment. Upload the complete <strong>data</strong> folder and redeploy the site.</div>'
  );
});
