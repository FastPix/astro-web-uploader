/// <reference types="astro/client" />

declare module "*.astro" {
  const Component: AstroComponentFactory;
  export default Component;
}
