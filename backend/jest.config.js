module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>']
}
