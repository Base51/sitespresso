# Architecture Design Prompt

Use this prompt to define and document the technical architecture of a project.

---

## Context

> Describe the system being designed, its scale, and key constraints.

## Questions to Answer

1. What are the main components or services?
2. How do components communicate (REST, GraphQL, events, etc.)?
3. What data stores are needed (relational, NoSQL, blob storage)?
4. What are the authentication and authorization mechanisms?
5. How is the system deployed (cloud provider, containers, serverless)?
6. What are the scalability and reliability requirements?
7. What are the main security considerations?

## Output Format

- **Architecture Diagram:** Describe components and their relationships (use Mermaid if possible).
- **Component Breakdown:** Table with component name, responsibility, and technology.
- **Data Flow:** Step-by-step description of the primary data flow.
- **Infrastructure:** Hosting, CI/CD, monitoring strategy.
- **Trade-offs & Decisions:** Key architectural decisions with rationale (ADR-style).
