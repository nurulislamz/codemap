import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type JsonReport = {
  stats?: {
    startTime?: string;
    duration?: number;
    expected?: number;
    unexpected?: number;
    flaky?: number;
    skipped?: number;
  };
  suites?: JsonSuite[];
};

type JsonSuite = {
  title?: string;
  file?: string;
  line?: number;
  column?: number;
  suites?: JsonSuite[];
  specs?: JsonSpec[];
};

type JsonSpec = {
  title?: string;
  file?: string;
  line?: number;
  column?: number;
  tests?: JsonTestCase[];
};

type JsonTestCase = {
  title?: string;
  status?: string;
  tags?: string[];
  projectName?: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
  results?: JsonTestResult[];
};

type JsonTestResult = {
  status?: string;
  error?: {
    message?: string;
    stack?: string;
  };
  errors?: Array<{
    message?: string;
    stack?: string;
  }>;
  attachments?: Array<{
    name?: string;
    path?: string;
    contentType?: string;
  }>;
};

type Finding = {
  status: string;
  title: string;
  file?: string;
  line?: number;
  project?: string;
  tags: string[];
  message: string;
  artifactPaths: string[];
};

const jsonReportPath = resolve("test-results/e2e-full-results.json");
const markdownReportPath = resolve("test-results/e2e-findings-report.md");

mkdirSync(dirname(jsonReportPath), { recursive: true });

const command = [
  "pnpm",
  "exec",
  "playwright",
  "test",
  "--grep",
  "@full",
  "--reporter=list,json",
];

console.log(`[e2e] running: corepack ${command.join(" ")}`);

const runResult = spawnSync("corepack", command, {
  stdio: "inherit",
  env: {
    ...process.env,
    PLAYWRIGHT_JSON_OUTPUT_FILE: jsonReportPath,
  },
});

const report = readJsonReport(jsonReportPath);
const findings = report ? collectFindings(report) : [];
const markdown = buildMarkdownReport(report, findings);
writeFileSync(markdownReportPath, markdown, "utf8");

console.log(`[e2e] findings report written: ${markdownReportPath}`);
console.log("[e2e] policy: report-only phase, do not apply app fixes in this run");

if (runResult.error) {
  throw runResult.error;
}

if (typeof runResult.status === "number") {
  process.exit(runResult.status);
}

if (runResult.signal) {
  process.kill(process.pid, runResult.signal);
}

process.exit(1);

function readJsonReport(path: string): JsonReport | null {
  if (!existsSync(path)) {
    return null;
  }

  const raw = readFileSync(path, "utf8");
  if (!raw.trim()) {
    return null;
  }

  return JSON.parse(raw) as JsonReport;
}

function collectFindings(report: JsonReport): Finding[] {
  const findings: Finding[] = [];

  walkSuites(report.suites ?? [], [], findings);

  return findings;
}

function walkSuites(suites: JsonSuite[], titlePath: string[], findings: Finding[]) {
  for (const suite of suites) {
    const nextPath = suite.title ? [...titlePath, suite.title] : titlePath;

    for (const spec of suite.specs ?? []) {
      const specTitlePath = spec.title ? [...nextPath, spec.title] : [...nextPath];

      for (const testCase of spec.tests ?? []) {
        const testTitle = testCase.title ? [...specTitlePath, testCase.title].join(" › ") : specTitlePath.join(" › ");
        const results = testCase.results ?? [];
        const finalResult = results[results.length - 1];
        const caseStatus = testCase.status ?? "unknown";
        const finalStatus = finalResult?.status ?? "unknown";
        const isFinding =
          caseStatus === "unexpected" ||
          caseStatus === "flaky" ||
          finalStatus === "failed" ||
          finalStatus === "timedOut" ||
          finalStatus === "interrupted";

        if (!isFinding) {
          continue;
        }

        const errorMessage =
          finalResult?.error?.message ??
          finalResult?.errors?.[0]?.message ??
          finalResult?.error?.stack ??
          finalResult?.errors?.[0]?.stack ??
          "No error message available.";

        const location = testCase.location ?? {
          file: spec.file ?? suite.file,
          line: spec.line ?? suite.line,
          column: spec.column ?? suite.column,
        };

        const artifactPaths = (finalResult?.attachments ?? [])
          .map((attachment) => attachment.path)
          .filter((path): path is string => Boolean(path));

        findings.push({
          status: caseStatus !== "unknown" ? caseStatus : finalStatus,
          title: testTitle,
          file: location.file,
          line: location.line,
          project: testCase.projectName,
          tags: testCase.tags ?? [],
          message: compactMessage(errorMessage),
          artifactPaths,
        });
      }
    }

    walkSuites(suite.suites ?? [], nextPath, findings);
  }
}

function compactMessage(message: string) {
  return message.replace(/\s+/g, " ").trim();
}

function buildMarkdownReport(report: JsonReport | null, findings: Finding[]) {
  const generatedAt = new Date().toISOString();
  const stats = report?.stats;

  const expected = stats?.expected ?? 0;
  const unexpected = stats?.unexpected ?? 0;
  const flaky = stats?.flaky ?? 0;
  const skipped = stats?.skipped ?? 0;
  const total = expected + unexpected + flaky + skipped;
  const durationMs = stats?.duration ?? 0;

  const lines: string[] = [
    "# E2E Findings Report",
    "",
    `Generated: ${generatedAt}`,
    `Command: corepack pnpm exec playwright test --grep @full`,
    "Policy: report-only phase (no app fixes in this run)",
    "",
    "## Summary",
    "",
    `- Total tests: ${total}`,
    `- Passed: ${expected}`,
    `- Failed: ${unexpected}`,
    `- Flaky: ${flaky}`,
    `- Skipped: ${skipped}`,
    `- Duration: ${Math.round(durationMs / 1000)}s`,
    "",
  ];

  if (!report) {
    lines.push("## Findings");
    lines.push("");
    lines.push("- JSON test report was not produced. Check Playwright execution logs.");
    lines.push("");
    return lines.join("\n");
  }

  if (findings.length === 0) {
    lines.push("## Findings");
    lines.push("");
    lines.push("- No failing or flaky findings.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Findings");
  lines.push("");

  findings.forEach((finding, index) => {
    lines.push(`${index + 1}. [${finding.status}] ${finding.title}`);
    lines.push(`- Location: ${formatLocation(finding.file, finding.line)}`);
    lines.push(`- Project: ${finding.project ?? "unknown"}`);
    lines.push(`- Tags: ${finding.tags.length > 0 ? finding.tags.join(", ") : "none"}`);
    lines.push(`- Error: ${finding.message}`);

    if (finding.artifactPaths.length > 0) {
      lines.push(`- Artifacts: ${finding.artifactPaths.join(", ")}`);
    }

    lines.push("");
  });

  return lines.join("\n");
}

function formatLocation(file?: string, line?: number) {
  if (!file) {
    return "unknown";
  }

  if (typeof line === "number") {
    return `${file}:${line}`;
  }

  return file;
}
