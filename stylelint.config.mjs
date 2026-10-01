const stylelintConfig = {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    // SCSS Modules use camelCase roots and nested BEM elements/modifiers.
    'selector-class-pattern': null,
    'scss/selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*(?:__[a-z][a-zA-Z0-9]*)?(?:--[a-z][a-zA-Z0-9]*)?$',
      { resolveNestedSelectors: true },
    ],
    // Blank lines separate semantic groups of design tokens.
    'scss/dollar-variable-empty-line-before': null,
    // Preserve the platform font's canonical spelling.
    'value-keyword-case': ['lower', { ignoreKeywords: ['BlinkMacSystemFont'] }],
  },
}

export default stylelintConfig
