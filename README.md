# BlockBallot

## Intructions:

### Running

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

----

### Testing

Run `npm run test` to run all tests. 

Run `npm run test:coverage` to run all tests and view coverage. 

Run `npx jest path/to/the/file_to.test.ts` to run one test suite


Here you go, Rajdeep — the whole thing rewritten cleanly in **Markdown format**, ready for your presentation notes or GitHub docs.

---
---
---

# ### **Tech Stack Used**

Based on the project structure and configuration files, here is the full tech stack used to build **BlockBallot**:

---

## **Core Application Framework**

### **Framework**

* **Next.js (App Router)**
  Evidenced by the `src/app` directory and `next.config.mjs`.

### **Language**

* **TypeScript**
  Entire project uses `.ts` and `.tsx` for strong typing.

### **Styling**

* **Tailwind CSS**
  Confirmed by `tailwind.config.ts` and `postcss.config.mjs`.

### **UI Components**

* **Shadcn UI (likely)**
  The folder structure `src/components/ui/...` (button, card, dialog) matches Shadcn patterns.

---

## **Blockchain & Smart Contracts**

### **Smart Contract Language**

* **Solidity (v0.8.24)**
  Used for `BlockBallotSingle.sol`.

### **Development Environment**

* **Hardhat**
  For compiling, deploying, and unit-testing contracts.

### **Network**

* **Arbitrum Sepolia Testnet**
  Configuration shows **Chain ID 421614**.

### **Interaction Library**

* **Ethers.js (implied)**
  Standard library for Hardhat + TypeScript interaction.

---

## **Backend & Database**

### **Database + Authentication**

* **Supabase**
  Used for:

  * Authentication (email-based)
  * Database tables (elections, users, votes)
  * Key-value storage (e.g., vote locks)

### **Key-Value Store**

* **Redis-style KV (via Supabase or similar)**
  Referenced in code as `kvStore` for locking + preventing duplicate votes.

---

## **Testing & Quality Assurance**

### **Testing Framework**

* **Jest**
  Supported by `jest.config.ts` and `jest.setup.ts`.

### **Linting & Formatting**

* **ESLint**
* **Prettier**

---

## **Documentation & Diagrams**

### **Diagramming**

* **Mermaid.js**
  Used for architectural diagrams such as:

  * `auth-flow.mmd`
  * `system-architecture.mmd`

---
