import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcrypt";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const TEMPLATES = [
  {
    name: "cover-default",
    category: "cover",
    svgContent: `<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#004ac6" width="1920" height="1080"/>
  <text x="960" y="480" font-family="Manrope" font-size="72" fill="white" text-anchor="middle">slot-title</text>
  <text x="960" y="600" font-family="Inter" font-size="32" fill="rgba(255,255,255,0.8)" text-anchor="middle">slot-subtitle</text>
</svg>`,
    schemaJson: JSON.stringify({
      type: "object",
      properties: {
        title: { type: "string", title: "Title" },
        subtitle: { type: "string", title: "Subtitle" },
      },
      required: ["title"],
    }),
  },
  {
    name: "toc-default",
    category: "toc",
    svgContent: `<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#f7f9fb" width="1920" height="1080"/>
  <text x="960" y="100" font-family="Manrope" font-size="48" fill="#191c1e" text-anchor="middle">Table of Contents</text>
  <g transform="translate(400, 200)">slot-toc-items</g>
</svg>`,
    schemaJson: JSON.stringify({
      type: "object",
      properties: {
        items: { type: "array", title: "TOC Items", items: { type: "string" } },
      },
    }),
  },
  {
    name: "section-header",
    category: "section-header",
    svgContent: `<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#6a1edb" width="1920" height="1080"/>
  <text x="960" y="540" font-family="Manrope" font-size="80" fill="white" text-anchor="middle">slot-section-title</text>
</svg>`,
    schemaJson: JSON.stringify({
      type: "object",
      properties: {
        sectionTitle: { type: "string", title: "Section Title" },
      },
      required: ["sectionTitle"],
    }),
  },
  {
    name: "text-default",
    category: "text",
    svgContent: `<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#f7f9fb" width="1920" height="1080"/>
  <text x="960" y="120" font-family="Manrope" font-size="48" fill="#191c1e" text-anchor="middle">slot-title</text>
  <text x="200" y="250" font-family="Inter" font-size="28" fill="#434655">slot-bullets</text>
</svg>`,
    schemaJson: JSON.stringify({
      type: "object",
      properties: {
        title: { type: "string", title: "Title" },
        bullets: { type: "array", title: "Bullets", items: { type: "string" } },
      },
      required: ["title", "bullets"],
    }),
  },
  {
    name: "two-column",
    category: "two-column",
    svgContent: `<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#f7f9fb" width="1920" height="1080"/>
  <text x="960" y="120" font-family="Manrope" font-size="48" fill="#191c1e" text-anchor="middle">slot-title</text>
  <rect x="100" y="200" width="800" height="700" fill="#eceef0" rx="8"/>
  <rect x="1020" y="200" width="800" height="700" fill="#eceef0" rx="8"/>
  <text x="500" y="400" font-family="Inter" font-size="24" fill="#434655">slot-left</text>
  <text x="1420" y="400" font-family="Inter" font-size="24" fill="#434655">slot-right</text>
</svg>`,
    schemaJson: JSON.stringify({
      type: "object",
      properties: {
        title: { type: "string", title: "Title" },
        left: { type: "string", title: "Left Column" },
        right: { type: "string", title: "Right Column" },
      },
      required: ["title", "left", "right"],
    }),
  },
  {
    name: "image-text",
    category: "image-text",
    svgContent: `<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#f7f9fb" width="1920" height="1080"/>
  <rect x="100" y="150" width="900" height="700" fill="#eceef0" rx="8"/>
  <rect x="1100" y="200" width="720" height="600" fill="white" rx="8"/>
  <text x="1420" y="350" font-family="Manrope" font-size="40" fill="#191c1e" text-anchor="middle">slot-title</text>
  <text x="1420" y="450" font-family="Inter" font-size="24" fill="#434655" text-anchor="middle">slot-description</text>
  <text x="1420" y="600" font-family="Inter" font-size="20" fill="#737686" text-anchor="middle">slot-image-caption</text>
</svg>`,
    schemaJson: JSON.stringify({
      type: "object",
      properties: {
        title: { type: "string", title: "Title" },
        description: { type: "string", title: "Description" },
        imageCaption: { type: "string", title: "Image Caption" },
      },
      required: ["title", "description"],
    }),
  },
  {
    name: "ending-default",
    category: "ending",
    svgContent: `<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#004ac6" width="1920" height="1080"/>
  <text x="960" y="480" font-family="Manrope" font-size="72" fill="white" text-anchor="middle">Thank You</text>
  <text x="960" y="600" font-family="Inter" font-size="32" fill="rgba(255,255,255,0.8)" text-anchor="middle">slot-contact</text>
</svg>`,
    schemaJson: JSON.stringify({
      type: "object",
      properties: {
        contact: { type: "string", title: "Contact Info" },
      },
    }),
  },
];

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const hashedPassword = await bcrypt.hash("demo123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@cognitivecanvas.ai" },
    update: {},
    create: {
      email: "demo@cognitivecanvas.ai",
      name: "Demo User",
      password: hashedPassword,
    },
  });
  console.log("Created user:", user.email);

  // Create demo project
  const project = await prisma.project.upsert({
    where: { id: "demo-project-001" },
    update: {},
    create: {
      id: "demo-project-001",
      userId: user.id,
      name: "Demo Presentation",
      description: "A demo project to showcase the system",
      status: "idle",
    },
  });
  console.log("Created project:", project.name);

  // Create demo presentation
  const presentation = await prisma.presentation.upsert({
    where: { id: "demo-presentation-001" },
    update: {},
    create: {
      id: "demo-presentation-001",
      projectId: project.id,
      title: "Demo Presentation",
    },
  });
  console.log("Created presentation:", presentation.title);

  // Create templates
  for (const template of TEMPLATES) {
    await prisma.template.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }
  console.log(`Created ${TEMPLATES.length} templates`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
