import { h } from "preact"

export const manifest = {
  name: "atlas-access",
  displayName: "Nutriwork Atlas access",
  description: "Client-side global password barrier for casual privacy.",
  version: "0.1.0",
  quartzVersion: ">=5.0.0",
  category: "component",
}

export default function AtlasAccessPrivacy() {
  return {
    name: "AtlasAccessPrivacy",
    htmlPlugins: () => [],
    externalResources: () => ({
      additionalHead: [
        h("meta", {
          name: "robots",
          content: "noindex, nofollow, noarchive",
        }),
      ],
    }),
  }
}

AtlasAccessPrivacy.quartzCategory = "transformer"
