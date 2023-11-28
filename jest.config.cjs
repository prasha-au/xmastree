/** @returns {Promise<import('jest').Config>} */
module.exports = async () => ({
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }]
  },
  coverageReporters: ['html', 'text', 'cobertura'],
});