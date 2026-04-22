---
title: About the Author
---

```js
import {renderPagePager} from "./components/pagePager.js";

const profilePictureUrl = await FileAttachment("./legacy/_file/img/profilePicture.4b4496a1.jpeg").url();
```

# About the Author

---

```js
display(html`<div class="author-hero">
  <div id="login-container">
    <img class="profile-img" src="${profilePictureUrl}" alt="Zhihao (Howard) Yao">
    <h3>Zhihao (Howard) Yao</h3>
    <div class="description">
      A skilled data scientist with over 15 years of expertise in data management, analytics, and visualization, bringing a unique combination of government experience as a mathematical statistician at the FDA and industry experience as a Senior Principal Data Scientist at a leading medical device company.
      <br><br>
      Proven ability to deliver impactful insights and drive data-driven decisions across diverse environments. This diverse expertise spans across regulatory settings and industry-driven innovation, consistently applying advanced analytics to inform critical decision-making.
    </div>
    <div class="social">
      <a href="https://zhihaohowardyao.github.io/" target="_blank" rel="noopener noreferrer">Personal Website</a>
      <a href="https://www.linkedin.com/in/zhihaohowardyao/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </div>
  </div>
</div>`);
```

## Demo Projects Portfolio

### Statistics | Likelihood Ratio-Based Tests for Drug/Device Data Monitoring

<div class="grid grid-cols-4" style="grid-auto-rows: auto;">
  <div class="card"><a href="https://www.kaggle.com/code/howardyao/deming-conference-lrt-presentation" target="_blank" rel="noopener noreferrer">Likelihood Ratio-Based Test (LRT) Method</a><br><br>Introduces core LRT ideas and applications to drug/device post-market safety surveillance.</div>
  <div class="card"><a href="https://observablehq.com/@howardyao/lrt-method-application-part-1" target="_blank" rel="noopener noreferrer">LRT Application Part 1: Data Wrangling</a><br><br>Creates an adverse events data frame for further LRT analysis from FAERS JSON inputs.</div>
  <div class="card"><a href="https://observablehq.com/@howardyao/lrt-method-application-part-2" target="_blank" rel="noopener noreferrer">LRT Application Part 2: Signal Detection and Visualization</a><br><br>Shows how the LRT method retains good power and sensitivity for identifying safety signals.</div>
  <div class="card"><a href="https://observablehq.com/@howardyao/lrt-method-application-part-2" target="_blank" rel="noopener noreferrer">LRT Signal Analysis Application</a><br><br>An interactive LRT analysis application with dynamic parameters such as drug name, date range, and event limits.</div>
</div>

### Statistics | Propensity Score

<div class="grid grid-cols-4" style="grid-auto-rows: auto;">
  <div class="card"><a href="https://observablehq.com/@howardyao/stat-notes-leveraging-external-evidence-for-augmenting-cl?collection=@howardyao/stat-notes" target="_blank" rel="noopener noreferrer">Leveraging External Evidence for Augmenting Clinical Study</a><br><br>Explores propensity-score-integrated approaches for leveraging real-world data in clinical studies.</div>
  <div class="card"><a href="https://observablehq.com/@howardyao/propensity-score-r-package-matchit-introduction?collection=@howardyao/stat-notes" target="_blank" rel="noopener noreferrer">Propensity Score R Package MatchIt Introduction</a><br><br>A practical introduction to MatchIt for covariate balance in observational studies.</div>
</div>

### Machine Learning

<div class="grid grid-cols-4" style="grid-auto-rows: auto;">
  <div class="card"><a href="https://observablehq.com/@howardyao/machine-learning-notes-1?collection=@howardyao/machine-learning-notes" target="_blank" rel="noopener noreferrer">ML | 1 Introduction, Math, and Statistics</a><br><br>Frequentist vs Bayesian, MLE, and core statistics concepts.</div>
  <div class="card"><a href="https://observablehq.com/@howardyao/machine-learning-notes-2?collection=@howardyao/machine-learning-notes" target="_blank" rel="noopener noreferrer">ML | 2 Linear Regression</a><br><br>Least squares, regularization, and MAP estimation.</div>
  <div class="card"><a href="https://observablehq.com/@howardyao/ml-3-linear-classification-3-1?collection=@howardyao/machine-learning-notes" target="_blank" rel="noopener noreferrer">ML | 3.1 Linear Classification</a><br><br>Perceptron, LDA, loss functions, and gradient descent.</div>
  <div class="card"><a href="https://observablehq.com/@howardyao/ml-7-ensemble-learning?collection=@howardyao/machine-learning-notes" target="_blank" rel="noopener noreferrer">ML | 7 Ensemble Learning</a><br><br>Bagging, boosting, AdaBoost, and gradient boosting.</div>
</div>

### Visualization

<div class="grid grid-cols-4" style="grid-auto-rows: auto;">
  <div class="card"><a href="https://observablehq.com/@howardyao/visualization-selection-diagram" target="_blank" rel="noopener noreferrer">Visualization Selection Diagram</a><br><br>Maps common chart types to distribution, relationship, composition, and comparison tasks.</div>
  <div class="card"><a href="https://observablehq.com/@howardyao/covid-19-global-dataset-visualization" target="_blank" rel="noopener noreferrer">Covid-19 Global Dataset Visualization</a><br><br>A ridgeline plot dashboard showing how dynamic interaction can improve dense visual summaries.</div>
  <div class="card"><a href="https://observablehq.com/@howardyao/sequence-alignment-dashboard" target="_blank" rel="noopener noreferrer">Sequence Alignment Dashboard</a><br><br>An interactive protein sequence alignment dashboard with minimap and consensus support.</div>
  <div class="card"><a href="https://observablehq.com/@howardyao/2021-top-30-medical-device-companies" target="_blank" rel="noopener noreferrer">Top 30 Medical Device Companies</a><br><br>A visual breakdown of revenue, profit, and scale metrics for major medical device companies.</div>
</div>

```js
display(renderPagePager("/About-Author"));
```

<style>
@import url('https://fonts.googleapis.com/css?family=Roboto|Sriracha&display=swap');

.author-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 3rem 0 5rem;
  text-wrap: balance;
  text-align: center;
}

#login-container {
  position: relative;
  width: min(760px, calc(100vw - 5rem));
  min-height: 360px;
  margin: 0 auto;
  padding: 1.5rem 2.5rem 2rem 2.5rem;
  box-sizing: border-box;
  border-radius: 10px;
  background-color: #fffffb;
  box-shadow: 6px 10px 16px rgba(0, 0, 0, 0.22);
}

.profile-img {
  position: absolute;
  top: -42px;
  left: -42px;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 15px rgba(100, 100, 100, 0.1);
}

#login-container h3 {
  padding-top: 0.5rem;
  font-size: 30px;
  font-weight: 700;
  font-family: "Roboto", var(--sans-serif);
}

.description {
  margin: 2rem auto 0;
  max-width: 38rem;
  color: #333;
  line-height: 1.6;
  font-size: 16px;
  font-family: "Roboto", var(--sans-serif);
}

.social {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2.5rem;
  margin-top: 1.75rem;
}

.social a {
  display: inline-block;
  min-width: 200px;
  padding: 0.7rem 1rem;
  border: 2px solid #3b5fc0;
  border-radius: 6px;
  font-family: "Roboto", var(--sans-serif);
  font-size: 16px;
}

.social a:hover {
  background: #3b5fc0;
  color: white;
  text-decoration: none;
}
</style>
