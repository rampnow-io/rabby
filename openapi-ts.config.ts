import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'shared/api/wallet.yaml',
  output: 'src/snippets/client',
  plugins: [
    '@hey-api/sdk',
    {
      name: '@hey-api/typescript',
      enums: 'typescript',
    },
  ],
});
