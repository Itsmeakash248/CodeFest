# Claude × Material 3 Expressive --- Theme Design Spec

## 1. Design vision

Create a calm, thoughtful interface inspired by Claude's warm editorial
character and Material 3 Expressive's bold shapes, dynamic color, and
playful component design.

**Keywords:** warm, intelligent, human, tactile, expressive, accessible.

**Design principle:** Claude's restraint + Material's personality. Keep
content clear and spacious; use expressive shapes and color to make
interactions feel alive, not noisy.

## 2. Color system

### Light theme

  Token                      Hex         Usage
  -------------------------- ----------- ---------------------------------
  `background`               `#F7F3EC`   Main app canvas
  `surface`                  `#FFFCF7`   Cards, sheets, input surfaces
  `surface-container`        `#EEE8DF`   Secondary containers
  `surface-container-high`   `#E6DED3`   Elevated or selected surfaces
  `text-primary`             `#292824`   Main text and headings
  `text-secondary`           `#6D675F`   Supporting text and metadata
  `outline`                  `#C9C0B5`   Borders and dividers
  `primary`                  `#B9573D`   Primary actions and key accents
  `on-primary`               `#FFFFFF`   Text/icons on primary
  `primary-container`        `#F4D8CC`   Soft accent surfaces
  `on-primary-container`     `#542416`   Text on primary container
  `secondary`                `#686B4E`   Secondary actions
  `secondary-container`      `#E5E5CD`   Secondary tonal surfaces
  `tertiary`                 `#625B8A`   Occasional expressive accent
  `tertiary-container`       `#E8DFFF`   Highlight surfaces
  `success`                  `#386A4A`   Success states
  `warning`                  `#8A5B16`   Warning states
  `error`                    `#B3261E`   Error states

### Dark theme

  Token                      Hex         Usage
  -------------------------- ----------- ---------------------------------
  `background`               `#191A17`   Main app canvas
  `surface`                  `#20211D`   Cards and input surfaces
  `surface-container`        `#292A25`   Secondary containers
  `surface-container-high`   `#34352F`   Elevated or selected surfaces
  `text-primary`             `#F1EDE4`   Main text and headings
  `text-secondary`           `#C2BBAF`   Supporting text and metadata
  `outline`                  `#514F47`   Borders and dividers
  `primary`                  `#F0A18A`   Primary actions and key accents
  `on-primary`               `#482316`   Text/icons on primary
  `primary-container`        `#713B2B`   Accent surfaces
  `on-primary-container`     `#FFDAD0`   Text on primary container
  `secondary`                `#C9CAA7`   Secondary actions
  `secondary-container`      `#414332`   Secondary tonal surfaces
  `tertiary`                 `#C9BDF7`   Occasional expressive accent
  `tertiary-container`       `#494365`   Highlight surfaces
  `success`                  `#9BD0A6`   Success states
  `warning`                  `#F0C078`   Warning states
  `error`                    `#F2B8B5`   Error states

**Color guidance** - Use warm cream and charcoal as the foundation. -
Reserve terracotta for primary actions, active states, and important
emphasis. - Use lavender and olive sparingly for secondary accents and
status differentiation. - Avoid using every accent in one view. -
Maintain accessible text contrast; verify final combinations with a
contrast checker.

## 3. Typography

Use a clean, readable sans-serif for interface text and an editorial
display style for prominent headings.

-   **Preferred UI font:** Roboto Flex or system sans-serif.
-   **Optional editorial heading font:** a restrained serif such as
    Georgia, used only for selected hero headings.
-   **Body:** 16 px / 1.55 line height.
-   **Supporting text:** 14 px / 1.45 line height.
-   **Label:** 12 px / 1.35 line height, medium weight.
-   **Title small:** 20 px / 1.25 line height, semibold.
-   **Title large:** 28--32 px / 1.15 line height, semibold.
-   **Display:** 40--48 px / 1.05 line height, only for spacious landing
    or welcome screens.

Keep long-form text at a comfortable measure of roughly 60--75
characters per line. Avoid excessive all-caps labels and heavy bolding.

## 4. Shape and layout

Use Material 3 Expressive-inspired shape variety while keeping the
overall interface composed.

  Element                     Shape guidance
  --------------------------- --------------------------
  Primary buttons             Fully rounded pill
  Text fields                 20--24 px radius
  Cards                       24--28 px radius
  Dialogs and bottom sheets   28--32 px radius
  Chips                       Fully rounded pill
  Avatars                     Circular
  Small icon buttons          Rounded square or circle

-   Base spacing scale: 4, 8, 12, 16, 24, 32, 40, 48 px.
-   Standard page padding: 20--24 px on mobile; 32 px or more on wide
    layouts.
-   Use generous whitespace around reading and composing areas.
-   Prefer tonal separation over heavy outlines and shadows.
-   Keep interactive targets at least 48 × 48 dp where applicable.

## 5. Components

### Buttons

-   Primary: terracotta fill, high-contrast label, pill shape.
-   Secondary: tonal surface with dark or light foreground.
-   Tertiary: text-only with clear hover, pressed, and focus states.
-   Use concise action labels and a clear hierarchy; avoid multiple
    competing primary buttons.

### Cards

-   Use warm surface colors and large corner radii.
-   Keep shadows subtle; prefer tonal elevation.
-   Use expressive color blocks only for meaningful grouping, not
    decoration.

### Text fields and composer

-   Large, rounded input surface.
-   Comfortable internal padding and visible focus state.
-   Placeholder text uses secondary color and must remain legible.
-   Composer actions should be visually secondary to the message
    content.
-   Support multiline content without abrupt layout shifts.

### Navigation

-   Use a clear active indicator with a soft tonal container.
-   Keep labels short and navigation predictable.
-   Expressive navigation shapes must not reduce label legibility or
    touch target size.

### Chips and filters

-   Pill-shaped with distinct selected and unselected states.
-   Selected chips use a tonal fill, not color alone; include a
    checkmark or other cue when useful.

### Dialogs and sheets

-   Large rounded corners, clear title/body/action hierarchy.
-   Keep the most important action visually prominent.
-   Avoid stacking too many nested surfaces.

### Icons

-   Use a consistent outline or rounded icon family.
-   Standard sizes: 20, 24, and 28 px.
-   Do not mix filled and outlined styles without a clear state-based
    reason.

## 6. Motion and interaction

Motion should feel responsive and soft, never ornamental or slow.

-   Micro-interactions: 120--180 ms.
-   Standard transitions: 200--280 ms.
-   Larger sheet or page transitions: 280--360 ms.
-   Prefer standard easing curves; use spring motion only for selected
    expressive elements.
-   Provide clear pressed, focused, selected, disabled, loading, and
    error states.
-   Respect reduced-motion preferences.
-   Avoid motion that delays task completion or causes layout
    instability.

## 7. Content and voice

Use calm, direct, human language.

-   Prefer helpful verbs: "Ask", "Write", "Explore", "Try again".
-   Avoid overly playful copy in error, security, or high-stakes states.
-   Empty states should explain what the user can do next.
-   Errors should explain the issue and offer a recovery action.
-   Do not use color as the only carrier of meaning.

## 8. Accessibility

-   Meet WCAG AA contrast targets for text wherever applicable.
-   Provide visible keyboard focus indicators.
-   Support screen readers with meaningful labels and logical reading
    order.
-   Ensure touch targets are comfortably sized.
-   Pair status colors with icons or text.
-   Respect platform font scaling and reduced-motion settings.
-   Test light and dark themes independently.

## 9. Implementation notes

-   Map these semantic tokens to the platform's theme system rather than
    hard-coding colors in individual components.
-   On Android, translate tokens into Material 3 `ColorScheme`,
    typography, shapes, and component themes.
-   On the web, expose tokens as CSS custom properties and use semantic
    component classes.
-   Use the system's dynamic color only as an optional adaptation layer;
    preserve the signature warm terracotta identity.
-   Validate contrast, focus, pressed states, and component behavior on
    real devices and viewport sizes.

## 10. Design summary

**Signature:** warm cream surfaces, charcoal text, terracotta actions,
editorial typography, pill buttons, oversized rounded cards, and
restrained expressive accents.

**Avoid:** neon gradients, excessive shadows, tiny controls, too many
accent colors, and decorative motion that competes with content.
