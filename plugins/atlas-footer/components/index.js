import { h } from "preact"

const PLUS_URL = "https://plus.gruponutriwork.com.br/"

export const AtlasFooter = () => {
  const AtlasFooterComponent = () =>
    h(
      "footer",
      { class: "atlas-footer" },
      h("p", null, `Nutriwork Atlas © ${new Date().getFullYear()}`),
      h("a", { href: PLUS_URL }, "Nutriwork Plus"),
    )

  AtlasFooterComponent.css = `
.atlas-footer {
  align-items: center;
  border-top: 1px solid var(--lightgray);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  justify-content: space-between;
  margin: 2rem 0 4rem;
  opacity: 0.8;
  padding-top: 1rem;
}

.atlas-footer p {
  margin: 0;
}

.atlas-footer a {
  color: var(--secondary);
  font-weight: 600;
}

@media all and (max-width: 800px) {
  .atlas-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
`

  return AtlasFooterComponent
}
