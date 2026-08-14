const generatedCommandPattern = /^dsh plugin --profile (?:<profile>|web) add (github:\S+)$/;

export function displayInstallCommand(command: string): string {
  const match = generatedCommandPattern.exec(command);
  if (!match) return command;

  const spec = match[1];
  const commandSpec = spec.includes("&path:")
    ? spec
    : spec.replace(/#[^&]+$/, "");
  return `npx -p @deepseek-ai/dsh dsh plugin --profile web add ${commandSpec}`;
}
