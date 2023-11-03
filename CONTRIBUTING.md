# Contributing Docs

## How to Release

Ready to release a new version?

- Create a PR and update the package.json with the new version
- Ensure the CHANGELOG has been appropriately updated
- Merge the pr, create a tag for the new version, and push. The new tag will lead to [this workflow](https://github.com/grafana/grafana-azure-sdk-react/blob/main/.github/workflows/publish-npm.yml) being triggered.
