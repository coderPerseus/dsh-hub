UPDATE plugin_search
SET
  topics = COALESCE((
    SELECT
      COALESCE(json_extract(p.raw_json, '$.repository.topics'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.categories'), '')
    FROM plugin_snapshots p
    WHERE p.run_id = plugin_search.run_id
      AND p.plugin_id = plugin_search.plugin_id
  ), topics),
  usage = COALESCE((
    SELECT
      COALESCE(json_extract(p.raw_json, '$.repository.owner'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.repository.name'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.repository.defaultBranch'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.repository.homepage'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.package.version'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.package.bundlePatch'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.package.peerDependencies'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.compatibility.harnessRange'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.compatibility.cordisRange'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.compatibility.checks'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.installation.spec'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.installation.command'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.installation.markdown'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.installation.notes'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.usage.summary'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.usage.markdown'), '') || ' ' ||
      COALESCE(json_extract(p.raw_json, '$.i18n'), '')
    FROM plugin_snapshots p
    WHERE p.run_id = plugin_search.run_id
      AND p.plugin_id = plugin_search.plugin_id
  ), usage);
