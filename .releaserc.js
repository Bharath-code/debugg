module.exports = {
  branches: [
    '+([0-9])?(.{+([0-9]),x}).x',
    'main',
    'next',
    'next-major',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: '# Changelog\n\nAll notable changes to this project will be documented in this file.\n',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: true,
        pkgRoot: '.',
        tarballDir: 'dist',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'dist/*.tgz', label: 'NPM Package' },
          { path: 'dist/*.js', label: 'JavaScript Bundle' },
          { path: 'dist/*.d.ts', label: 'TypeScript Definitions' },
        ],
        successComment: `:tada: This issue has been resolved in version \${nextRelease.version} :tada:
        
The release is available on:
- [npm package](https://www.npmjs.com/package/debugg/v/\${nextRelease.version})
- [GitHub release](https://github.com/your-org/debugg/releases/tag/v\${nextRelease.version})

Your **[semantic-release](https://github.com/semantic-release/semantic-release)** bot :package: :rocket:`,
        failComment: false,
        labels: ['release'],
        assignees: ['maintainers'],
      },
    ],
  ],
  preset: 'conventionalcommits',
  presetConfig: {
    types: [
      { type: 'feat', section: 'Features' },
      { type: 'fix', section: 'Bug Fixes' },
      { type: 'perf', section: 'Performance Improvements' },
      { type: 'revert', section: 'Reverts' },
      { type: 'docs', section: 'Documentation' },
      { type: 'style', section: 'Styles', hidden: true },
      { type: 'refactor', section: 'Code Refactoring' },
      { type: 'test', section: 'Tests', hidden: true },
      { type: 'build', section: 'Build System' },
      { type: 'ci', section: 'Continuous Integration' },
      { type: 'chore', section: 'Chores', hidden: true },
    ],
  },
  releaseRules: [
    { type: 'docs', scope: 'README', release: 'patch' },
    { type: 'refactor', release: 'patch' },
    { type: 'style', release: 'patch' },
    { breaking: true, release: 'major' },
    { revert: true, release: 'patch' },
  ],
  tagFormat: 'v${version}',
};
