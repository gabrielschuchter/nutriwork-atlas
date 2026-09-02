import { i18n } from "../../i18n"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg, ctx }: QuartzComponentProps) => {
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = ctx.argv.serve ? "/" : url.pathname

  return (
    <article class="atlas-not-found">
      <div class="atlas-not-found-card">
        <p class="atlas-not-found-kicker">NUTRIWORK ATLAS</p>
        <p class="atlas-not-found-code">404</p>
        <h1>Esta página não foi encontrada</h1>
        <p class="atlas-not-found-message">{i18n(cfg.locale).pages.error.notFound}</p>
        <a class="atlas-not-found-link" href={baseDir}>
          {i18n(cfg.locale).pages.error.home}
        </a>
      </div>
    </article>
  )
}

NotFound.css = `
.atlas-not-found {
  align-items: center;
  display: flex;
  justify-content: center;
  margin: 0 auto;
  max-width: 48rem;
  min-height: min(72vh, 42rem);
  padding: clamp(2rem, 8vw, 5rem) 1rem;
}

.atlas-not-found-card {
  background: color-mix(in srgb, var(--light) 88%, var(--secondary) 12%);
  border: 1px solid var(--lightgray);
  border-radius: 24px;
  box-shadow: 0 24px 70px color-mix(in srgb, var(--dark) 14%, transparent);
  box-sizing: border-box;
  padding: clamp(2rem, 7vw, 4rem);
  text-align: center;
  width: min(100%, 38rem);
}

.atlas-not-found-kicker {
  color: var(--secondary);
  font-family: var(--codeFont);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0 0 1rem;
}

.atlas-not-found-code {
  color: var(--secondary);
  font-family: var(--headerFont);
  font-size: clamp(4rem, 15vw, 7rem);
  font-weight: 700;
  letter-spacing: -0.08em;
  line-height: 0.9;
  margin: 0;
}

.atlas-not-found h1 {
  color: var(--dark);
  font-family: var(--headerFont);
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin: 1.5rem 0 0.75rem;
}

.atlas-not-found-message {
  color: var(--darkgray);
  line-height: 1.55;
  margin: 0 auto;
  max-width: 32rem;
}

.atlas-not-found-link {
  align-items: center;
  background: var(--secondary);
  border: 1px solid var(--secondary);
  border-radius: 999px;
  color: white;
  display: inline-flex;
  font-weight: 700;
  justify-content: center;
  margin-top: 1.75rem;
  min-height: 2.75rem;
  padding: 0.65rem 1.15rem;
}

.atlas-not-found-link:hover {
  background: var(--tertiary);
  border-color: var(--tertiary);
  color: white;
}

.atlas-not-found-link:focus-visible {
  outline: 3px solid var(--secondary);
  outline-offset: 3px;
}

@media all and (max-width: 800px) {
  .atlas-not-found {
    min-height: 65vh;
    padding-inline: 0;
  }

  .atlas-not-found-card {
    border-radius: 20px;
    padding: 2rem 1.25rem;
  }
}
`

export default (() => NotFound) satisfies QuartzComponentConstructor
