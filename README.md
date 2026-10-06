# FarmOps – Smart Farm Resource Management Dashboard
*Demo Farm Data – For Academic Project (values are sample data, not real-time).*

## 1. Project Title
FarmOps – Smart Farm Resource Management Dashboard

## 2. Problem Statement
Design a resource-management plan for a farm to optimize the use of water, fertilizers, labour, machinery, and land while maintaining crop productivity.

## 3. Aim
Give a farm manager one dashboard to monitor the five resources and optimize their use without reducing productivity.

## 4. Objectives
- Monitor water, fertilizer, labour, machinery and land in one place.
- Compare actual usage with planned/recommended values.
- Generate rule-based recommendations automatically.
- Allow add / edit / delete of records, saved in LocalStorage.
- Visualise data with live Chart.js charts and a printable report.

## 5. Existing Problem
Farm resources are tracked on paper or by memory, so over-irrigation, excess fertilizer, idle machines, uneven workloads and unused land go unnoticed.

## 6. Proposed Solution
A browser-based operations dashboard (Green Valley Farm, 9 acres, 4 crops) that calculates utilization, shows status badges and applies IF-THEN rules to suggest improvements.

## 7. System Modules
Dashboard (`index.html`), Water, Fertilizer, Labour, Machinery, Land, Reports. `script.js` = data + logic, `style.css` = shared design.

## 8. System Architecture
```
Farm Manager
   ↓
FarmOps Dashboard
   ↓
| Water | Fertilizer | Labour | Machinery | Land |
   ↓
Resource Usage Analysis  (metrics())
   ↓
Optimization Rules       (recs())
   ↓
Recommendations
   ↓
Improved Resource Utilization
   ↓
Maintained Crop Productivity
```

## 9. Resource Optimization Methodology
`metrics()` computes: Water % = used ÷ planned; Fertilizer % = used ÷ recommended; Labour % = working ÷ present workers; Machinery % = in-use ÷ total; Land % = cultivated ÷ total area; Productivity = average field productivity.
Efficiency = 100 − |usage − 85| (best when usage is about 85% of plan).
Rules in `recs()`:

| Condition | Recommendation |
|---|---|
| Water > planned | Reduce irrigation frequency / irrigate early morning |
| Fertilizer > recommended | Review fertilizer allocation |
| Labour < 60% | Redistribute available workers |
| Machinery < 50% | Schedule machinery for another field |
| Land < 80% | Plan an additional crop |
| Productivity > 85% | Allocation is performing efficiently |

## 10. Technologies Used
HTML5, CSS3, JavaScript (ES6), Chart.js 4 (CDN), LocalStorage. No framework, no server.

## 11. Functional Requirements
Summary cards; crop dropdown chart; efficiency rings; recommendations; CRUD for irrigation, fertilizer, workers, machines, fields; search and crop filter; attendance toggle; daily water log; report generation; reset demo data.

## 12. Non-Functional Requirements
Runs offline except the Chart.js CDN; responsive (desktop / tablet / mobile); beginner-readable commented code; data persists in the browser.

## 13. Implementation
Each HTML file is a small shell (`<body data-page="water">`). `script.js` builds the sidebar/top bar and the page content, so every page shares one design. A generic `tableHTML()` + `openForm()` pair provides Add/Edit/Delete for all tables. Charts are redrawn by `chart()` after every change (`REFRESH()`).

## 14. Testing
See test cases below.

## 15. Results and Analysis
With the demo data: water 68% (Optimal), fertilizer 86% (High), labour 78%, machinery utilization 43% (Low), land 100%, productivity 87%. The system warns about fertilizer and idle machinery and confirms productivity is healthy: usage is balanced without hurting yield.

## 16. Expected Benefits
Less water and fertilizer waste, balanced labour, better machine usage, full land use, quicker decisions.

## 17. Limitations
Sample data only; no live sensors; single user; data stored only in one browser; no login.

## 18. Future Enhancements
IoT sensors, weather API, login, database backend, PDF export, mobile app, AI yield prediction.

## 19. Conclusion
FarmOps shows how monitoring and simple rules can optimise farm resources while keeping crop productivity high.

