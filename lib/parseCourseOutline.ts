export type ParsedLesson = {
  title: string;
  video_url: string | null;
  content_html: string;
};

export type ParsedModule = {
  title: string;
  week_number: number | null;
  learning_objectives: string[];
  lessons: ParsedLesson[];
};

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function linesToHtml(lines: string[]): string {
  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") {
      if (current.length) {
        paragraphs.push(current.join("<br>"));
        current = [];
      }
    } else {
      current.push(escapeHtml(line.trim()));
    }
  }
  if (current.length) paragraphs.push(current.join("<br>"));
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

export function parseCourseOutline(raw: string): ParsedModule[] {
  const lines = raw.split("\n");
  const modules: ParsedModule[] = [];
  let currentModule: ParsedModule | null = null;
  let currentLesson: ParsedLesson | null = null;
  let currentContentLines: string[] = [];

  function finalizeLesson() {
    if (currentLesson && currentModule) {
      currentLesson.content_html = linesToHtml(currentContentLines);
      currentModule.lessons.push(currentLesson);
    }
    currentLesson = null;
    currentContentLines = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    if (/^##\s+/.test(line)) {
      finalizeLesson();
      const rest = line.replace(/^##\s+/, "").trim();
      const weekMatch = rest.match(/^week\s+(\d+)\s*:\s*(.*)$/i);
      currentModule = {
        title: weekMatch ? weekMatch[2].trim() : rest,
        week_number: weekMatch ? parseInt(weekMatch[1], 10) : null,
        learning_objectives: [],
        lessons: [],
      };
      modules.push(currentModule);
      continue;
    }

    if (/^objectives:/i.test(line) && currentModule) {
      const rest = line.replace(/^objectives:/i, "").trim();
      currentModule.learning_objectives = rest.split("|").map((s) => s.trim()).filter(Boolean);
      continue;
    }

    if (/^###\s+lesson:/i.test(line) && currentModule) {
      finalizeLesson();
      const title = line.replace(/^###\s+lesson:/i, "").trim();
      currentLesson = { title, video_url: null, content_html: "" };
      continue;
    }

    if (/^video:/i.test(line) && currentLesson) {
      currentLesson.video_url = line.replace(/^video:/i, "").trim() || null;
      continue;
    }

    if (currentLesson) {
      currentContentLines.push(line);
    }
  }

  finalizeLesson();
  return modules.filter((m) => m.title);
}
