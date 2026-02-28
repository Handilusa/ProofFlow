module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        'import/extensions': 'off',
        'no-console': 'off',
        'import/prefer-default-export': 'off',
    },
};
