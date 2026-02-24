# Project Overview

This is a personal portfolio website for Ali Umar, a Software Engineer. It is built using the [Astro](https://astro.build/) web framework and styled with [Tailwind CSS](https://tailwindcss.com/). The project showcases personal projects, includes a resume page, and is deployed to GitHub Pages.

## Key Technologies

*   **Framework:** Astro
*   **Styling:** Tailwind CSS, DaisyUI
*   **Language:** TypeScript
*   **Package Manager:** npm
*   **Deployment:** GitHub Actions, Docker, Nginx

# Building and Running

## Prerequisites

*   [Node.js](https://nodejs.org/en)
*   [Astro](https://astro.build/)

## Local Development

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Building for Production

To create a production build, run the following command:

```bash
npm run build
```

The output will be in the `dist/` directory.

# Development Conventions

## Project Structure

*   `src/pages`: Contains the pages of the site.
*   `src/layouts`: Contains the layout components for pages.
*   `src/components`: Contains reusable components.
*   `src/data`: Contains data for projects and resume.
*   `src/styles`: Contains global styles.
*   `src/config.ts`: Contains site-wide configuration like the title and description.
*   `public`: Contains static assets like images and fonts.

## Coding Style

*   **TypeScript:** The project uses TypeScript with `strictNullChecks` enabled.
*   **Path Aliases:** Path aliases are configured in `tsconfig.json` for easier imports:
    *   `@components/*`: `src/components/*`
    *   `@layouts/*`: `src/layouts/*`
*   **Formatting:** The project uses [Prettier](httpss://prettier.io/) for code formatting.

## Deployment

The project is deployed using a CI/CD pipeline with GitHub Actions. The `publish.yml` workflow builds the Astro application and deploys it to GitHub Pages. There is also a `Dockerfile` and `nginx.conf` for containerized deployments.
