# Laravel frontend-ui Adapter

This adapter translates the framework-agnostic `frontend-ui` core into Laravel-specific implementation guidance.

The agnostic core remains authoritative.

Use the Laravel version, packages, and conventions actually present in the project.

Do not infer the engineering concern from Laravel technology alone.


<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_START -->

## Absorbed Legacy Laravel Knowledge

> Preserved from retired standalone Laravel skills.
> This section is implementation guidance only.
> Universal engineering rules remain in the agnostic core.

# Laravel migration bundle: frontend-ui

> Temporary migration artifact.
>
> This file preserves Laravel-specific source knowledge while legacy standalone skills are being retired.
> Universal engineering requirements belong in the agnostic core.
> Framework-specific implementation guidance belongs in the Laravel adapter.

Concepts: 9

## blade-components-and-layouts

Legacy family: `frontend-ui`

Aliases: `blade-components-and-layouts`, `laravel:blade-components-and-layouts`

### Legacy knowledge

# Blade Components And Layouts

Use this skill when a Laravel task involves blade components and layouts.

When the app has multiple menus/pages, also use `module-per-menu`: keep one Blade view per page or page state, share layout/components, and avoid a single Blade file full of menu-condition blocks.

When the Blade work includes UI/UX design, frontend implementation, browser inspection, or backend contract alignment, also use `ui-agent-browser`. Keep this skill focused on template structure, component boundaries, slots, layouts, and rendering purity.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `blade-components-and-layouts` topic from `jpcaparas/superpowers-laravel` into the local `blade-components-and-layouts` catalog without copying third-party skill body text.

## Syarif Defaults

- Follow Laravel conventions before introducing custom abstractions.
- Prefer project-local patterns when they are explicit and tested.
- Keep controllers focused on HTTP orchestration.
- Put validation, authorization, transactions, side effects, and integrations at clear boundaries.
- Keep client names, credentials, internal URLs, provider secrets, and project-specific business rules out of reusable standards.
- Verify important behavior with the smallest meaningful tests and quality checks.

## Workflow

1. Detect the Laravel version, PHP version, runner, package manager, and existing project conventions.
2. Identify the smallest local skill set that overlaps this topic.
3. Implement or review the change using Laravel-native APIs first.
4. Add abstractions only when they reduce real complexity or protect a meaningful boundary.
5. Run targeted tests and available quality checks before handoff.

## Checkpoints

- Authorization and validation boundaries are explicit.
- Query shape, transactions, queues, cache, files, and external calls are intentional when touched.
- User-facing behavior has feature, unit, browser, or integration tests at the right level.
- Logs and errors are useful without exposing secrets or unnecessary personal data.
- Documentation or proposals avoid importing source-project names or one-off business rules.

## Related Skills

- `using-laravel-standards`
- `architecture`
- `ui-agent-browser`
- `module-per-menu`
- `testing`
- `security`

## custom-helpers

Legacy family: `frontend-ui`

Aliases: `custom-helpers`, `laravel:custom-helpers`

### Legacy knowledge

# Custom Helpers

Use this skill when a Laravel task involves custom helpers.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `custom-helpers` topic from `jpcaparas/superpowers-laravel` into the local `custom-helpers` catalog without copying third-party skill body text.

## Syarif Defaults

- Follow Laravel conventions before introducing custom abstractions.
- Prefer project-local patterns when they are explicit and tested.
- Keep controllers focused on HTTP orchestration.
- Put validation, authorization, transactions, side effects, and integrations at clear boundaries.
- Keep client names, credentials, internal URLs, provider secrets, and project-specific business rules out of reusable standards.
- Verify important behavior with the smallest meaningful tests and quality checks.

## Workflow

1. Detect the Laravel version, PHP version, runner, package manager, and existing project conventions.
2. Identify the smallest local skill set that overlaps this topic.
3. Implement or review the change using Laravel-native APIs first.
4. Add abstractions only when they reduce real complexity or protect a meaningful boundary.
5. Run targeted tests and available quality checks before handoff.

## Checkpoints

- Authorization and validation boundaries are explicit.
- Query shape, transactions, queues, cache, files, and external calls are intentional when touched.
- User-facing behavior has feature, unit, browser, or integration tests at the right level.
- Logs and errors are useful without exposing secrets or unnecessary personal data.
- Documentation or proposals avoid importing source-project names or one-off business rules.

## Related Skills

- `using-laravel-standards`
- `architecture`
- `testing`
- `security`

## livewire-development

Legacy family: `frontend-ui`

Aliases: `livewire-development`

### Legacy knowledge

# Livewire Development

Use this skill for Laravel Livewire implementation, refactoring, debugging, security review, performance work, and tests.

This is the canonical Livewire skill in this repository. It consolidates the former `livewire-patterns` guidance and the public `laravel-livewire` topic into one version-aware workflow.

When the Livewire work is primarily UI/UX design, visual browser iteration, frontend flow shaping, or backend contract alignment, also use `ui-agent-browser`. Use `e2e-playwright` when browser behavior needs durable Playwright coverage.

## Detect The Project First

1. Read `composer.json` and `composer.lock` or run `composer show livewire/livewire` to confirm the installed major version.
2. Inspect existing components, routes, tests, layouts, and `config/livewire.php` before choosing syntax.
3. Detect whether the project uses class-based components, Volt, Livewire v4 single-file components, multi-file components, or a mixture maintained for compatibility.
4. Follow the project's Blade, Alpine, Tailwind, Flux, Filament, and testing conventions when present.
5. Use documentation for the installed major version. Do not introduce v4-only attributes, directives, component paths, or routing into v2/v3 projects.

Read [references/livewire-4.md](references/livewire-4.md) when the project uses Livewire v4 or the task involves v4 migration, component formats, directives, attributes, or routing.

## Implementation Workflow

1. Define one interactive surface and its user-visible states.
2. Choose the component format already used by the project; change formats only for a concrete maintenance benefit.
3. Model the smallest public state needed by the template.
4. Add validation and authorization before persistence or external side effects.
5. Delegate reusable domain workflows to Actions or Services.
6. Shape queries deliberately, add loading and error feedback, and keep DOM identity stable.
7. Test validation, authorization, persistence, events, redirects, and browser-only behavior at the appropriate level.

## Component Boundaries

A component may:

- hold UI and request-shaped state;
- validate input and authorize actions;
- call an Action or Service;
- dispatch focused events;
- coordinate rendering, pagination, uploads, and browser feedback.

A component should not:

- contain long multi-model workflows;
- build provider payloads inline;
- duplicate model-state authorization that belongs in Policies;
- keep secrets, unbounded collections, or large serialized graphs in public state;
- perform slow external calls during rendering;
- bypass a transaction for atomic writes.

## State And Security

- Treat every public property and action parameter as untrusted client input.
- Validate input and authorize the resolved model or operation inside every mutating action.
- Prefer model binding or explicit model lookup followed by a Policy check; never trust a submitted identifier by itself.
- Use `#[Locked]` only where supported to prevent client mutation of identifiers, but keep authorization because locking is not access control.
- Keep helper methods `protected` or `private` when they must not be callable as component actions.
- Store secrets and service credentials in configuration or injected services, never component state.
- Restrict mass-assignment payloads to validated, explicitly selected fields.

Read [references/testing-and-security.md](references/testing-and-security.md) for a secure action pattern, testing matrix, and browser-test boundaries.

## Forms And Data Binding

- Use Livewire validation for component-local forms.
- Use Form objects when a form has substantial state or rules; move reusable domain rules to shared rule objects or services.
- Normalize localized numbers, dates, booleans, and text before applying validation rules.
- Use plain `wire:model` when synchronization on the next action is sufficient.
- Use `.live`, `.blur`, `.change`, debounce, or throttle deliberately; avoid extra requests without a UX requirement.
- Reset or pull state after successful submission when the interaction should return to a clean form.
- Show field-level errors and disable or style in-flight actions to prevent accidental duplicate submissions.

## Queries, Rendering, And Performance

- Eager load relationships used by the view and select only required columns on hot paths.
- Paginate lists instead of storing unbounded Eloquent collections in public properties.
- Keep `render()` and computed properties free of hidden repeated or unbounded queries.
- Cache computed results across requests only when keys, authorization scope, invalidation, and staleness are understood.
- Add stable `wire:key` values to repeated components and dynamic list items.
- Re-key dependent controls when their available options depend on another field.
- Lazy-load below-the-fold or expensive components only when the installed Livewire version supports the chosen API.
- Prefer the project's existing loading-state pattern; Livewire v4 can style automatic `data-loading` attributes, while `wire:loading` remains useful for targeted visibility.

## Events, Nesting, And JavaScript

- Prefer direct props and actions for parent-child relationships; use events for decoupled UI coordination.
- Keep event names local, intention-revealing, and payloads small.
- Use reactive/modelable props only when the installed version supports them and the parent-child synchronization is necessary.
- Use Alpine for truly client-local state such as disclosure, focus, or transitions.
- Use Livewire JavaScript hooks or component scripts for browser APIs and third-party widgets; isolate initialization and cleanup so DOM morphing does not duplicate handlers.
- Use browser tests for focus management, modals, uploads, previews, drag/drop, navigation, and third-party JavaScript integration.

## Testing And Handoff

Test the smallest behavior that proves the risk:

- component rendering and initial state;
- validation failures and normalized input;
- authorization denial for properties and action parameters;
- successful database changes and transaction boundaries;
- dispatched events, redirects, pagination, uploads, and query-string state;
- loading, focus, modal, navigation, and JavaScript behavior in a browser test when component tests cannot prove it.

Use factories and Laravel fakes for files, queues, notifications, mail, and HTTP integrations. Run targeted tests, formatting, static analysis, and frontend checks supported by the project before handoff.

## Related Skills

- `actions-and-services` for reusable workflows and integrations.
- `database-transactions` for atomic multi-write actions.
- `filesystem-uploads` for storage and file lifecycle rules.
- `policies-and-authorization` for model access decisions.
- `ui-agent-browser` for stack-aware UI/UX implementation and browser inspection.
- `e2e-playwright` for durable browser workflow coverage.
- `responsive-ui-testing` for viewport and browser-state coverage.
- `testing` for test selection and handoff verification.

## livewire-patterns

Legacy family: `frontend-ui`

Aliases: `laravel:livewire-patterns`

### Legacy knowledge

# Livewire Patterns

Apply Livewire rules only when the project uses Livewire. Detect the installed version and existing component conventions before changing components.

## Component Boundaries

Keep Livewire components focused on one interactive surface. Move reusable business workflows into Actions or Services when logic grows beyond component state and UI orchestration.

A component may:

- hold UI state;
- validate user input;
- call Actions/Services;
- dispatch browser or Livewire events;
- render a focused view.

A component should not:

- contain long multi-model workflows;
- build provider payloads inline;
- duplicate domain authorization that belongs in Policies;
- bypass transactions for atomic writes.

## Validation

Use Livewire validation APIs for component-local forms. Use shared rule objects, enums, helpers, or Form Request-like methods when rules are reused outside the component.

Normalize human-formatted input before numeric validation.

## Authorization

Authorize actions that mutate data. Use Policies for model-state decisions.

```php
public function save(UpdateRecord $update): void
{
    $this->authorize('update', $this->record);

    $data = $this->validate();

    $update->handle($this->record, $data);

    $this->dispatch('record-saved');
}
```

## Queries And Rendering

Eager load relations needed by the component view. Use pagination for lists and avoid loading unbounded datasets into component state.

Keep computed properties and render methods free of expensive repeated queries unless cached or intentionally scoped.

## Testing

Test Livewire components for:

- validation errors;
- authorization denial;
- emitted/dispatched events;
- database changes;
- interactions that are not covered by normal feature tests.

Use browser E2E tests for behavior that depends on JavaScript, focus, modals, uploads, or browser-only state.

## module-per-menu

Legacy family: `frontend-ui`

Aliases: `laravel:module-per-menu`, `module-per-menu`

### Legacy knowledge

# Module Per Menu

Use this skill whenever creating, copying, refactoring, or expanding a Laravel web application with multiple menus, pages, dashboards, reports, or admin screens.

Default to a module-per-menu structure unless the existing project already has a stronger convention.

## Standard Pattern

Use this shape for Laravel apps with menus or pages:

```text
Route -> Small Page/Resource Controller -> Action/Service/Query Service when needed -> Eloquent -> View/API Response
```

Organize UI work so one menu or page maps to one clear module:

```text
app/Http/Controllers/<Domain>/
  AuthController.php
  DashboardController.php
  GateInController.php
  GateOutController.php
  CustomerController.php
  ReportController.php

app/Services/<Domain>/
  DashboardReportService.php
  BillingService.php
  DailyReportService.php

resources/views/<domain>/
  layouts/app.blade.php
  pages/dashboard.blade.php
  pages/gate-in/index.blade.php
  pages/gate-in/create.blade.php
  pages/gate-out/index.blade.php
  pages/gate-out/process.blade.php
  components/filters.blade.php
  components/table.blade.php
```

## Controller Rules

- Keep controllers small and readable.
- Create one controller per menu, page group, or resource boundary.
- Let controllers orchestrate HTTP only: receive request, call validation/authorization, call service/action/query, return view/redirect/JSON.
- Move repeated query/report calculations to a Service or query object.
- Move multi-step writes to Actions or Services with explicit transactions when needed.
- Do not put unrelated menus into one controller just because they share a layout.
- Do not use one giant `PageController` or one giant `DepoWebController` for a full admin system.

## View Rules

- Use one Blade view per page or page state.
- Use a shared layout for sidebar, topbar, shell, asset loading, and page header.
- Use Blade components or partials for repeated filters, tables, badges, stats, modals, and form controls.
- Keep page Blade files focused on rendering one menu/page.
- Do not put all menus into one Blade file with large `@if ($active === ...)` blocks.
- Keep display data dynamic from Eloquent/model-backed services. Avoid hardcoded metrics except placeholders explicitly marked as prototype/demo.

## Route Rules

- Keep route files as mappings only.
- Use route groups for middleware, prefixes, and shared names.
- Place static routes before broad parameter routes.
- Prefer invokable controllers for single-page modules and normal controllers for page groups.
- Add route/render tests for every important menu or page.

## Dynamic Data Rules

- Build page metrics, summaries, charts, tables, and select options from database queries or model-backed services.
- Derive counts and totals from Eloquent collections or queries instead of duplicating numbers in Blade.
- Use Services for dashboards, financial reports, daily reports, billing quotes, sync contracts, or other reusable calculations.
- Keep seeded/demo data in seeders and factories, not embedded in views.

## Verification

Before handoff, run the smallest meaningful checks available:

- route list for changed route groups;
- feature tests that open each authenticated menu/page;
- API contract tests for new endpoints;
- `php artisan test`;
- Blade compile check such as `php artisan view:cache` followed by `php artisan view:clear`;
- frontend build when assets changed.

Report any checks that cannot run and why.

## responsive-ui-testing

Legacy family: `frontend-ui`

Aliases: `responsive-ui-testing`

### Legacy knowledge

# Responsive UI Testing

Use this skill when asked to test whether a Laravel application interface is responsive, mobile-friendly, or visually stable across screen sizes.

Do not conclude that a page is responsive merely because it loads on one mobile viewport or has no JavaScript errors.

When the request is to design, redesign, or implement the frontend before auditing it, use `ui-agent-browser` first. This skill is the final responsive and visual-stability gate after the UI and backend contract are already wired.

Use `e2e-playwright` when responsive findings should become durable Playwright regression tests.

## Primary Goals

Verify that the application remains usable and visually correct across:

- small mobile
- standard mobile
- large mobile
- tablet portrait
- laptop
- desktop
- wide desktop when the project has wide layouts or dashboards

## Required Viewports

Test at least these viewports:

| Target | Width | Height |
|---|---:|---:|
| Small mobile | 320 | 568 |
| Standard mobile | 375 | 812 |
| Large mobile | 430 | 932 |
| Tablet portrait | 768 | 1024 |
| Laptop | 1366 | 768 |
| Desktop | 1920 | 1080 |

Also test Playwright mobile device profiles when available, such as an iPhone and a Pixel device.

## Required Checks

For every tested page and viewport:

1. Navigate to the page and wait until network, fonts, images, and Livewire activity settle.
2. Check for horizontal document overflow.
3. Check whether visible elements extend outside the viewport.
4. Detect clipped, overlapping, or unreadable text.
5. Verify the navbar does not stack into unusable controls.
6. Verify the sidebar can open and close on small screens.
7. Verify forms can be completed without horizontal scrolling.
8. Verify buttons and links remain visible, clickable, and large enough for touch.
9. Verify tables have deliberate mobile behavior such as horizontal scroll, stacked cards, hidden secondary columns, or a redesigned mobile layout.
10. Verify modals, dropdowns, date pickers, and select menus fit inside the viewport.
11. Verify fixed and sticky elements do not cover important content.
12. Verify images keep their intended aspect ratio and do not stretch or crop important content accidentally.
13. Interact with Livewire components and repeat layout checks after state changes, validation errors, pagination, filtering, sorting, loading states, and empty states.
14. Test dark mode when the project supports it.
15. Capture screenshots for review.
16. Report failures with page, viewport, browser or device, selector, and evidence.

## Horizontal Overflow Check

Use a browser-side assertion like this:

```ts
const overflow = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  hasOverflow:
    document.documentElement.scrollWidth >
    document.documentElement.clientWidth + 1,
}));

expect(
  overflow.hasOverflow,
  `Horizontal overflow: ${overflow.scrollWidth}px > ${overflow.clientWidth}px`,
).toBeFalsy();
```

## Element Boundary Check

Inspect visible elements and report those extending outside the viewport:

```ts
const offenders = await page.evaluate(() => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return Array.from(document.querySelectorAll("body *"))
    .filter((element) => {
      const htmlElement = element as HTMLElement;
      const style = window.getComputedStyle(htmlElement);
      const rect = htmlElement.getBoundingClientRect();

      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        rect.width === 0 ||
        rect.height === 0
      ) {
        return false;
      }

      return (
        rect.left < -1 ||
        rect.right > viewportWidth + 1 ||
        rect.top < -1 ||
        rect.bottom > viewportHeight + 1
      );
    })
    .slice(0, 50)
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      id: element.id,
      className: String((element as HTMLElement).className),
      text: element.textContent?.trim().slice(0, 80),
      rect: element.getBoundingClientRect().toJSON(),
    }));
});

expect(offenders).toEqual([]);
```

Treat fixed-position overlays and intentionally scrollable containers carefully. Do not automatically mark deliberate off-canvas navigation as a failure.

## Playwright Test Skeleton

Create or update a project-local browser test such as `tests/e2e/responsive.spec.ts` when the project uses Playwright:

```ts
import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile-320", width: 320, height: 568 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1366", width: 1366, height: 768 },
  { name: "desktop-1920", width: 1920, height: 1080 },
];

const routes = ["/dashboard", "/settings"];

for (const viewport of viewports) {
  test.describe(viewport.name, () => {
    test.use({ viewport });

    for (const route of routes) {
      test(`${route} is responsive`, async ({ page }, testInfo) => {
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        await page.evaluate(() => document.fonts?.ready);

        const overflow = await page.evaluate(() => ({
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
        }));

        expect(
          overflow.documentWidth,
          `Horizontal overflow on ${route}`,
        ).toBeLessThanOrEqual(overflow.viewportWidth + 1);

        await expect(page).toHaveScreenshot(
          `${route.replaceAll("/", "-") || "home"}-${testInfo.project.name}.png`,
          { fullPage: true, animations: "disabled" },
        );
      });
    }
  });
}
```

Adapt routes to the real Laravel app. Seed deterministic data and authenticate through existing project helpers before asserting protected pages.

## Visual Regression Rules

Use screenshots for stable pages after:

- disabling animations
- freezing or mocking dynamic timestamps
- using deterministic seed data
- hiding unstable third-party widgets
- waiting for fonts and images
- avoiding screenshot comparison across inconsistent operating systems

## Laravel-Specific Checks

Inspect:

- Blade layouts and components
- Livewire components after state changes
- validation error messages
- authorization-dependent navigation
- paginated tables
- flash messages
- file-upload components
- loading indicators
- empty states
- long translated strings
- Tailwind or FlyonUI breakpoint classes
- dark mode variants when configured

## Reporting Format

Group findings by severity:

- Critical: the page cannot be used at a tested viewport.
- Major: important content or controls are clipped, inaccessible, overlapping, or impossible to operate.
- Minor: visual spacing or alignment is degraded but functionality remains usable.

For every issue include:

- route or page
- viewport
- browser or device
- affected component
- expected behavior
- actual behavior
- screenshot path
- probable source file
- recommended fix

## Completion Gate

Do not declare the application responsive unless:

- all required viewports were tested
- no unexplained horizontal document overflow exists
- navigation, sidebars, and core forms remain usable
- tables and modals have deliberate mobile behavior
- interactive Livewire states were tested
- dark mode was tested when supported
- failures and untested pages are explicitly reported

## task-scheduling

Legacy family: `frontend-ui`

Aliases: `laravel:task-scheduling`, `task-scheduling`

### Legacy knowledge

# Task Scheduling

Use this skill when a Laravel task involves task scheduling.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `task-scheduling` topic from `jpcaparas/superpowers-laravel` into the local `task-scheduling` catalog without copying third-party skill body text.

## Syarif Defaults

- Follow Laravel conventions before introducing custom abstractions.
- Prefer project-local patterns when they are explicit and tested.
- Keep controllers focused on HTTP orchestration.
- Put validation, authorization, transactions, side effects, and integrations at clear boundaries.
- Keep client names, credentials, internal URLs, provider secrets, and project-specific business rules out of reusable standards.
- Verify important behavior with the smallest meaningful tests and quality checks.

## Workflow

1. Detect the Laravel version, PHP version, runner, package manager, and existing project conventions.
2. Identify the smallest local skill set that overlaps this topic.
3. Implement or review the change using Laravel-native APIs first.
4. Add abstractions only when they reduce real complexity or protect a meaningful boundary.
5. Run targeted tests and available quality checks before handoff.

## Checkpoints

- Authorization and validation boundaries are explicit.
- Query shape, transactions, queues, cache, files, and external calls are intentional when touched.
- User-facing behavior has feature, unit, browser, or integration tests at the right level.
- Logs and errors are useful without exposing secrets or unnecessary personal data.
- Documentation or proposals avoid importing source-project names or one-off business rules.

## Related Skills

- `using-laravel-standards`
- `architecture`
- `testing`
- `security`

## template-method-and-plugins

Legacy family: `frontend-ui`

Aliases: `laravel:template-method-and-plugins`, `template-method-and-plugins`

### Legacy knowledge

# Template Method And Plugins

Use this skill when a Laravel task involves template method and plugins.

This skill is adapted to the personal Laravel standards in this repository. It maps the public `laravel:template-method-and-plugins` topic from `jpcaparas/superpowers-laravel` into the local `template-method-and-plugins` catalog without copying third-party skill body text.

## Syarif Defaults

- Follow Laravel conventions before introducing custom abstractions.
- Prefer project-local patterns when they are explicit and tested.
- Keep controllers focused on HTTP orchestration.
- Put validation, authorization, transactions, side effects, and integrations at clear boundaries.
- Keep client names, credentials, internal URLs, provider secrets, and project-specific business rules out of reusable standards.
- Verify important behavior with the smallest meaningful tests and quality checks.

## Workflow

1. Detect the Laravel version, PHP version, runner, package manager, and existing project conventions.
2. Identify the smallest local skill set that overlaps this topic.
3. Implement or review the change using Laravel-native APIs first.
4. Add abstractions only when they reduce real complexity or protect a meaningful boundary.
5. Run targeted tests and available quality checks before handoff.

## Checkpoints

- Authorization and validation boundaries are explicit.
- Query shape, transactions, queues, cache, files, and external calls are intentional when touched.
- User-facing behavior has feature, unit, browser, or integration tests at the right level.
- Logs and errors are useful without exposing secrets or unnecessary personal data.
- Documentation or proposals avoid importing source-project names or one-off business rules.

## Related Skills

- `using-laravel-standards`
- `architecture`
- `testing`
- `security`

## ui-agent-browser

Legacy family: `frontend-ui`

Aliases: `ui-agent-browser`

### Legacy knowledge

# UI Agent Browser

Use this skill when a Laravel task asks to build, redesign, implement, inspect, or judge frontend/UI/UX quality before the final responsive audit.

Treat the browser as the design surface and the backend contract as the source of truth. A UI is not done because the code compiles; it is done when the page communicates its purpose quickly, supports the real workflow, is wired to real routes or API contracts, and survives visual inspection in meaningful states.

## Workflow

1. Detect the target stack: Blade, Livewire, Inertia, Filament, Nova, Flux, Alpine, React, Vue, Tailwind, Bootstrap, component library, icon library, build tool, route structure, and test runner.
2. Inspect the existing frontend in a browser before designing: current route, layout shell, navigation, component language, visual density, interaction pattern, console errors, and rendered DOM or accessibility tree.
3. Read the backend surface that the UI must connect to: routes, controllers, Form Requests, policies, API Resources, DTOs, Inertia props, Livewire public state/actions, model relationships, events, files, and pagination.
4. Define the UI contract before styling: data needed, user actions, request payloads, validation errors, authorization-dependent controls, loading states, empty states, success states, and failure states.
5. Design to the detected stack, browser baseline, and project conventions. Reuse existing layouts, tokens, components, tables, forms, modals, navigation, and icons before introducing a new visual language.
6. Implement the UI in the target stack, wired to real backend routes, Livewire actions, Inertia props, or API clients. Avoid static-only screens unless the requested artifact is explicitly a mockup.
7. Inspect the result in a real browser with realistic data, screenshots, console output, interaction states, and at least mobile and desktop viewports.
8. Iterate on hierarchy, spacing, alignment, text fit, color, controls, and backend state mapping until the interface feels intentional and works through the real workflow.
9. Use `responsive-ui-testing` for the final viewport matrix when responsiveness, overflow, clipping, modals, tables, or visual regression matters.

## Browser Tool Strategy

Combine `agent-browser` and Playwright deliberately:

- Use the official `vercel-labs/agent-browser` repository as the source for current command behavior when agent-browser details matter: https://github.com/vercel-labs/agent-browser. Prefer its README or bundled `skills/agent-browser` guidance over remembered flags.
- Use the official `microsoft/playwright` repository as the source for current Playwright behavior when test, locator, browser, trace, CLI, or MCP details matter: https://github.com/microsoft/playwright. Prefer its README, docs, and API reference over remembered APIs.
- Use `agent-browser` for low-token exploration, quick interaction, screenshots, accessibility-tree snapshots, annotated screenshots, visual inspection, and short browser loops.
- Use Playwright for durable cross-browser tests, web-first assertions, resilient locators, auth setup, deterministic seeds, traces, screenshots in CI, regression coverage, and repeated workflows.
- Use `agent-browser read` on the active tab when rendered text/DOM is enough, then escalate to `snapshot` or screenshots only when structure or visual quality needs it.
- Prefer `agent-browser snapshot -i -c -d 5 --json` or a scoped selector snapshot for planning interactions; ask for full snapshots only when structure is genuinely unclear.
- Use annotated screenshots when visual layout, unlabeled icon buttons, canvas content, or spacing cannot be understood from the accessibility tree alone.
- Use `agent-browser batch --bail` for multi-step navigation, wait, snapshot, screenshot, and interaction flows to reduce command overhead.
- Use the default `agent-browser mcp` or `--tools core` profile when available; expand to `network`, `debug`, `react`, or `mobile` only when the task needs that surface.
- Fall back to Playwright when `agent-browser` is unavailable, when the project already has Playwright helpers, or when the result must become a committed test.

Use this division of labor:

- agent-browser discovers the current UI, explores states, captures compact evidence, and helps decide what to build.
- Playwright codifies the accepted workflow as repeatable browser coverage with `@playwright/test`, user-facing locators, isolation, deterministic data, traces, and screenshots.
- Convert agent-browser observations into Playwright assertions only after the UI/BE contract and visual behavior have stabilized.

## Backend Contract Alignment

Before implementing visible UI:

- Map every user action to a route, Livewire method, Inertia visit, form submit, API request, job trigger, file upload, or modal-only local action.
- Confirm required fields, validation rules, authorization rules, response shape, pagination metadata, filters, sort keys, and error format.
- Keep templates focused on rendering and interaction. Put queries, authorization, validation, side effects, and provider calls in Laravel boundaries.
- Use model-backed factories, seeders, fakes, or local API fixtures to make the browser state realistic without hardcoding fake UI-only data.
- Show backend states honestly: forbidden actions hidden or disabled, validation errors near fields, failed requests recoverable, queued/background work visible, and empty states useful.

## Design Rules

- Make the primary entity or task obvious in the first viewport.
- Prefer quiet, work-focused density for admin, CRM, ERP, SaaS, and operational pages.
- Use cards only for repeated items, modals, or genuinely framed tools. Do not nest cards inside cards.
- Keep section layouts full-width or unframed with constrained inner content.
- Use familiar controls: icon buttons for tool actions, tabs for view switching, segmented controls for modes, checkboxes or toggles for binary settings, menus for option sets, and inputs or sliders for numbers.
- Use the existing icon library when available. Prefer named icons over hand-drawn SVG controls.
- Keep border radii restrained unless the project design system says otherwise.
- Avoid one-note color palettes. Combine neutral surfaces with purposeful accent colors, semantic states, and enough contrast.
- Avoid decorative blobs, generic gradients, and stock-like visuals that do not clarify the product, place, object, or workflow.
- Do not add visible instructional copy that explains obvious UI mechanics. Let labels, affordances, grouping, and state do the work.

## Laravel UI Boundaries

- Use `blade-components-and-layouts` when the work touches reusable Blade layout or component structure.
- Use `livewire-development` when state, uploads, pagination, modals, filters, or dynamic interactions are Livewire-driven.
- Use `module-per-menu` when a multi-page admin app needs one page per module instead of conditional menu blocks in one Blade file.
- Use `e2e-playwright` when the browser workflow should become a durable test.
- Keep database queries, authorization, validation, and side effects out of templates.
- Build summaries, metrics, filters, tables, and select options from real model-backed data when the page is not a static mockup.
- Keep client names, private branding, internal URLs, sample customer data, phone numbers, and credentials out of reusable UI standards and screenshots intended for handoff.

## Browser Inspection Loop

When changing visible UI:

1. Start the project through its documented runner.
2. Visit the affected routes as the intended user role.
3. Capture screenshots for at least a narrow mobile viewport and a desktop viewport.
4. Check console errors, failed assets, missing fonts, broken images, hydration issues, and Livewire or Alpine errors.
5. Interact with primary controls, navigation, filters, forms, dropdowns, modals, pagination, and destructive confirmations.
6. Inspect the data contract while interacting: submitted payloads, response status, validation messages, optimistic updates, redirects, flash messages, and refreshed table or form data.
7. Re-check layout after loading, empty, validation-error, long-content, and success states when those states can be reached locally.

Do not rely only on static code review for visual quality.

## State Checklist

Cover the states that matter for the page:

- default data
- empty data
- long names, long translated strings, and large numbers
- loading or disabled controls
- validation errors
- success or flash messages
- unauthorized or hidden actions
- destructive confirmation
- filter or search results
- dark mode when supported

## Token Budget Rules

- Start with stack and contract discovery using `rg`, route lists, component names, and scoped browser snapshots.
- Prefer targeted file reads over loading whole frontend trees.
- Capture the existing frontend baseline with `agent-browser read`, scoped snapshots, or one screenshot before proposing broad UI changes.
- Prefer compact browser snapshots before screenshots; use screenshots when visual judgment matters.
- Keep browser evidence small: route, viewport, screenshot path, key console errors, and the exact failing or changed component.
- Convert repeated manual browser checks into Playwright only after the workflow stabilizes.

## Completion Gate

Do not call the UI finished unless:

- the page matches the existing project design language or intentionally introduces a coherent new one;
- the main workflow is visible and usable without reading explanatory text;
- frontend behavior is wired to the intended backend route, Livewire action, Inertia prop, or API contract;
- spacing, alignment, typography, icon use, and color look deliberate;
- text fits its containers on mobile and desktop;
- interactive states have been exercised in the browser;
- backend-driven states such as validation, authorization, loading, empty data, success, and failure are represented;
- screenshots or browser observations support the handoff;
- high-value or regression-prone browser flows are handed off to `e2e-playwright` when the project supports it;
- remaining visual risks are named explicitly.

<!-- ENGINEER_FLOW_LEGACY_LARAVEL_KNOWLEDGE_END -->
