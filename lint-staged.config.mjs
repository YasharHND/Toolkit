export default {
  '*.md': 'prettier --write',
  '*.json': 'prettier --write',
  '*.{ts,js,jsx}': (filenames) => [
    ...filenames.map((filename) => `eslint --fix ${filename}`),
    ...filenames.map((filename) => `prettier --write ${filename}`),
  ],
};
