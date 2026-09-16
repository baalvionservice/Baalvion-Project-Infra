# SkillMatch Pro: Product Specification

This document outlines the core roles, features, and user flows for the SkillMatch Pro platform.

## 1. Supported Roles

The platform categorizes tasks and users into five main professional verticals.

### 1.1. Engineering
- **Sub-Roles:** Frontend, Backend, Full Stack, DevOps, Mobile.
- **Role Description:** Engineers are responsible for designing, building, testing, and maintaining software applications and systems. They write code, fix bugs, and ensure applications are scalable, secure, and performant.

### 1.2. Design
- **Sub-Roles:** UI/UX Design, Graphic Design, Product Design, Motion Design.
- **Role Description:** Designers shape the user experience and visual identity of a product. They create wireframes, mockups, and prototypes, focusing on usability, aesthetics, and user satisfaction.

### 1.3. Marketing
- **Sub-Roles:** Digital Marketing, SEO, Content Marketing, Performance Marketing.
- **Role Description:** Marketers are responsible for creating awareness and driving adoption of a product. They develop strategies, create content, manage campaigns, and analyze market data to reach the target audience.

### 1.4. Business
- **Sub-Roles:** Sales, Operations, Business Development, Strategy.
- **Role Description:** Business professionals drive the company's growth and operational efficiency. They develop go-to-market strategies, build client relationships, optimize processes, and analyze market opportunities.

### 1.5. Data
- **Sub-Roles:** Data Analyst, Data Scientist, Machine Learning Engineer.
- **Role Description:** Data professionals work with large datasets to extract meaningful insights, build predictive models, and inform strategic decisions. They use statistical methods and programming to analyze data and present findings.

---

## 2. Role-Specific Details

### 2.1. Engineering

-   **Example Tasks:**
    1.  **Frontend:** Build a responsive, accessible search filter component for an e-commerce site using React.
    2.  **Backend:** Create a REST API endpoint with Node.js and Express that performs CRUD operations on a `products` collection in a database.
    3.  **Full Stack:** Develop a single-page to-do list application with user authentication and a persistent database.
    4.  **DevOps:** Write a Dockerfile and a `docker-compose.yml` to containerize a web application and its database.
    5.  **Bug Fix:** Diagnose and fix a memory leak in a provided piece of a Node.js application.

-   **Submission Types:**
    -   Link to a GitHub repository.
    -   ZIP file containing the source code.

-   **Evaluation Criteria:**
    -   **Correctness:** Does the solution meet all functional requirements?
    -   **Code Quality:** Is the code clean, well-structured, and readable?
    -   **Performance:** Is the application efficient and optimized?
    -   **Problem-Solving:** How effectively were challenges and constraints addressed?
    -   **Security:** Are there any obvious security vulnerabilities?

### 2.2. Design

-   **Example Tasks:**
    1.  **UI/UX:** Design a three-screen mobile user onboarding flow for a new social media app.
    2.  **Product Design:** Redesign the "Settings" page of an existing web application to improve usability and information architecture.
    3.  **Landing Page:** Create a high-fidelity mockup for a landing page for a new SaaS product.
    4.  **Graphic Design:** Create a logo and a simple brand style guide (colors, typography) for a fictional company.

-   **Submission Types:**
    -   Link to a Figma, Sketch, or Adobe XD file.
    -   PDF or high-resolution image files (PNG, JPG).

-   **Evaluation Criteria:**
    -   **Creativity & Visual Appeal:** Is the design aesthetically pleasing and original?
    -   **User-Centricity:** Is the design intuitive and easy to navigate for the target user?
    -   **Problem-Solving:** Does the design effectively solve the core problem outlined in the task?
    -   **Clarity of Communication:** How well are the design decisions explained or annotated?
    -   **Attention to Detail:** Is the design polished, consistent, and pixel-perfect?

### 2.3. Marketing

-   **Example Tasks:**
    1.  **Content Strategy:** Develop a content calendar for one month for a B2B tech startup, including blog post ideas, social media themes, and one newsletter concept.
    2.  **SEO:** Write a 1000-word, SEO-optimized blog post on the topic "The Future of Remote Work".
    3.  **Campaign Strategy:** Create a launch strategy for a new mobile game, outlining target audience, key channels, and messaging.
    4.  **Ad Copy:** Write three different versions of ad copy (headline and body) for a Facebook ad campaign promoting a new fitness app.

-   **Submission Types:**
    -   Document (PDF, Google Doc, Word).
    -   Presentation (PPT, Google Slides).

-   **Evaluation Criteria:**
    -   **Strategic Thinking:** Is there a clear, logical strategy behind the proposal?
    -   **Creativity:** Is the content engaging and original?
    -   **Audience Understanding:** Does the submission demonstrate a clear understanding of the target audience?
    -   **Clarity:** Is the message clear, concise, and persuasive?
    -   **Data-Informed Approach:** Are suggestions backed by logic or potential metrics for success?

### 2.4. Business

-   **Example Tasks:**
    1.  **Go-to-Market Strategy:** Develop a GTM strategy for a new AI-powered productivity tool targeting small businesses.
    2.  **Sales Pitch Deck:** Create a 5-slide pitch deck to sell a subscription service to enterprise clients.
    3.  **Business Case Study:** Analyze a given business problem (e.g., declining user engagement) and propose three actionable solutions.
    4.  **Partnership Proposal:** Identify two potential strategic partners for a travel tech company and outline the value proposition for each.

-   **Submission Types:**
    -   Presentation (PPT, Google Slides).
    -   Document (PDF, Word).

-   **Evaluation Criteria:**
    -   **Analytical Skills:** How well is the problem broken down and analyzed?
    -   **Business Acumen:** Does the submission show a strong understanding of market dynamics and business principles?
    -   **Problem-Solving:** Are the proposed solutions practical and impactful?
    -   **Communication:** Is the presentation clear, professional, and persuasive?
    -   **Strategic Thinking:** Does the submission demonstrate long-term vision?

### 2.5. Data

-   **Example Tasks:**
    1.  **Data Analysis & Visualization:** Analyze a provided sales dataset and create a dashboard (using any tool) that visualizes monthly revenue, top-selling products, and customer segmentation.
    2.  **Predictive Modeling:** Build a simple machine learning model to predict customer churn based on a provided dataset.
    3.  **Data Cleaning:** Take a messy CSV file with missing values and inconsistent formatting, and produce a clean, analysis-ready dataset.
    4.  **SQL Querying:** Write a complex SQL query to join multiple tables and extract specific business insights from a sample database.

-   **Submission Types:**
    -   Jupyter Notebook (`.ipynb`).
    -   Link to a public dashboard (Tableau, Power BI, Looker).
    -   SQL or Python script files.
    -   A report/presentation (PDF, PPT) summarizing findings.

-   **Evaluation Criteria:**
    -   **Technical Accuracy:** Are the code, queries, and models technically sound?
    -   **Analytical Approach:** Is the methodology for analysis logical and appropriate?
    -   **Clarity of Insights:** Are the findings clearly communicated and actionable?
    -   **Problem-Solving:** How were challenges like messy data or model limitations handled?
    -   **Visualization:** Is the data presented in a clear and effective way?

---

## 3. Use Case Flows

### 3.1. Candidate Flow
1.  **Onboarding:** Signs up, creates a profile with role preferences, skills, and experience.
2.  **Task Discovery:** Browses a marketplace of tasks, filtering by role, company, or difficulty.
3.  **Task Selection:** Views detailed task requirements, deadline, and evaluation criteria before starting.
4.  **Submission:** Uploads required files (e.g., GitHub link, Figma URL, PDF) to the platform.
5.  **Evaluation & Feedback:** Receives a notification when their submission is evaluated, and views their score and detailed, constructive feedback from the company.
6.  **Ranking:** (Optional) Views their rank on task-specific or skill-based leaderboards.

### 3.2. Company Flow
1.  **Onboarding:** Signs up and creates a company profile.
2.  **Task Creation:** Uses a form to create a new task, defining the role, title, detailed description, difficulty, deadline, and submission type. Can use AI assistant to generate description.
3.  **Task Publication:** Publishes the task to the marketplace for candidates to view and attempt.
4.  **Submission Management:** Receives and tracks all submissions for a given task in a centralized dashboard.
5.  **Evaluation:** Assigns reviewers to evaluate submissions. Reviewers score candidates against predefined criteria and provide written feedback.
6.  **Shortlisting:** Compares candidates on the dashboard, filters by score, and shortlists top performers.
7.  **Hiring:** Contacts shortlisted candidates to proceed to the next stage of the hiring process.

### 3.3. Admin Flow
1.  **Dashboard:** Logs in to view an overview of platform activity (new users, active tasks, total submissions).
2.  **User Management:** Manages all user accounts (Candidates and Companies), with the ability to view profiles, edit roles, or deactivate accounts.
3.  **Task & Submission Monitoring:** Oversees all tasks and submissions on the platform to ensure they adhere to community guidelines. Has the ability to moderate or remove content.
4.  **Platform Configuration:** Manages platform-wide settings, such as available role categories, skill tags, and content moderation rules.
