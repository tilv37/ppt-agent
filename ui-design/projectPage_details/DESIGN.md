# Design System Strategy: The Intelligent Canvas

## 1. Overview & Creative North Star
**Creative North Star: "The Cognitive Architecture"**

This design system moves away from the "SaaS template" aesthetic toward a high-end editorial experience that mirrors the clarity of human thought. We are not just building a tool; we are building a collaborative workspace where AI and human intelligence converge. 

The aesthetic is driven by **Structured Fluidity**. We break the rigid, boxed-in nature of traditional web apps by using intentional asymmetry and "The Layering Principle." By overlapping elements and utilizing varying levels of translucency, we create a sense of infinite digital space. This system prioritizes the content (the PPT outline and slides) as the hero, while the UI acts as a sophisticated, quiet concierge.

## 2. Colors & Surface Philosophy
The palette is anchored in "Intelligence Blue," used not as a filler color, but as a precise instrument for focus.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or layout containment. 
*   **Boundaries:** Define workspaces through background color shifts. For example, the Main Editor (`surface`) sits adjacent to the AI Chat Panel (`surface-container-low`).
*   **Nesting:** Depth is achieved through the hierarchy of surface tiers. A project card should use `surface-container-lowest` when placed on a `surface-container` background to create a "lifted" effect without a stroke.

### Surface Hierarchy & Glassmorphism
*   **Layering:** Use `surface-container-lowest` to `surface-container-highest` to stack information. The deeper the functionality (e.g., a settings popover), the higher the surface tier.
*   **Glass & Gradient Rule:** Floating elements (Modals, Hovering Toolbars) must utilize Glassmorphism. Use a semi-transparent `surface` color with a `backdrop-blur: 20px`. 
*   **Signature Textures:** For primary CTAs and the Agent's "Active" state, use a subtle linear gradient from `primary` (#004ac6) to `primary_container` (#2563eb) at a 135-degree angle. This adds "visual soul" and a sense of movement to the AI's processing.

## 3. Typography: Editorial Authority
The typography leverages two distinct personalities: the technical precision of **Inter** and the sophisticated, wide-stanced authority of **Manrope**.

*   **Display & Headlines (Manrope):** Used for project titles and "AI-Generated Thoughts." The generous kerning of Manrope provides an editorial, premium feel that commands attention.
*   **Body & Labels (Inter):** Used for high-efficiency reading, data entry, and chat threads. Inter’s tall x-height ensures clarity even at the `label-sm` (0.6875rem) level during complex Agent workflows.
*   **Tonal Contrast:** Always pair a `headline-md` (Manrope) with a `body-md` (Inter) for meta-information. This contrast signals the difference between "Creative Content" and "Technical Metadata."

## 4. Elevation & Depth
We reject traditional "drop shadows" in favor of **Tonal Layering** and **Ambient Glows**.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. The human eye perceives the color shift as a change in elevation.
*   **Ambient Shadows:** For high-level floating elements (like the AI Chat bubble), use a shadow with a blur radius of `32px` and a color derived from `on-surface` at 6% opacity. It should feel like a soft glow rather than a hard shadow.
*   **The "Ghost Border":** If a separation is functionally required for accessibility, use the `outline-variant` token at 15% opacity. Standard 100% opaque borders are forbidden.

## 5. Components
### The Three-Column Editor
The layout must be asymmetrical. 
1.  **Left (Navigation):** `surface-container-low`. Minimalist icons, no text labels until hover.
2.  **Center (The Canvas):** `surface`. The largest area. Slides are presented as `surface-container-lowest` objects.
3.  **Right (AI Intelligence):** `surface-container-high`. This is the most "active" zone, utilizing glassmorphism for the input field.

### Buttons & Interaction
*   **Primary:** Gradient fill (`primary` to `primary_container`), `xl` (0.75rem) roundedness. No border.
*   **Secondary:** Ghost style using `on-secondary-container` text. On hover, the background shifts to `secondary_container` at 40% opacity.
*   **Agent Progress Timelines:** Use a "Pulse" state. Instead of a standard loading bar, use a blurred gradient line that glows from `tertiary` (#6a1edb) to `primary`.

### Cards & Chat
*   **Project Cards:** Forbid dividers. Use `Spacing-6` (1.5rem) to separate the thumbnail from the metadata.
*   **Chat Bubbles:** AI responses use `surface-container-highest` with a `tertiary` left-accent-bar (2px). User messages use `primary_container` with `on_primary_container` text.

## 6. Do’s and Don’ts

| Do | Don't |
| :--- | :--- |
| **Do:** Use `Spacing-8` or `Spacing-10` between major UI sections to let the AI "breathe." | **Don't:** Use 1px gray lines to separate the sidebar from the editor. |
| **Do:** Use `manrope` for any text that is meant to feel "authored" or "premium." | **Don't:** Use `display` sizes for long-form body text. |
| **Do:** Use Tonal Layering (Surface-low on Surface) for card backgrounds. | **Don't:** Use high-opacity, dark drop shadows that "dirty" the UI. |
| **Do:** Use `tertiary` (#6a1edb) for moments of AI "magic" or insight. | **Don't:** Use the primary blue for status errors or warnings. |
| **Do:** Ensure all interactive elements have an `xl` or `lg` corner radius for a friendly, futuristic feel. | **Don't:** Mix corner radii; keep them consistent across the container stack. |

## 7. Accessibility & Motion
*   **Contrast:** Ensure all `on-surface-variant` text meets a 4.5:1 ratio against its respective surface container.
*   **Micro-interactions:** Elements should "lift" slightly (Y-axis -2px) when hovered, accompanied by a subtle increase in the Ambient Shadow's spread.
*   **The Agent "Think" State:** Use a soft, rhythmic opacity pulse (100% to 70%) on the `tertiary_container` elements when the AI is generating content. Avoid aggressive spinning loaders.