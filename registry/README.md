# Plugin registry

Add one YAML file per curated plugin. File names should use `owner__repository.yaml`.

```yaml
schemaVersion: 1
repository: owner/repository
categories:
  - tools
```

The catalog builder reads repository metadata, `package.json`, the bundle patch, and installation or usage sections from the repository through the GitHub Contents API. Registry files contain curation choices and optional presentation overrides.

Use a pull request to add or change entries. A registered repository is included only after the YAML schema and repository evidence pass CI. See [`docs/catalog-pipeline.md`](../docs/catalog-pipeline.md) for the full format and publishing flow.
