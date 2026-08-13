# Plugin registry

Add one YAML file per curated plugin. File names should use `owner__repository.yaml`.

```yaml
schemaVersion: 1
repository: owner/repository
categories:
  - tools
```

The catalog builder reads repository metadata, `package.json`, the bundle patch, and installation or usage sections from the repository through the GitHub Contents API. Registry files contain curation choices and optional presentation overrides.
