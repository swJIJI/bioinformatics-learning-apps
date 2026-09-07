

Bulk rnaseq lab · JSX
import { useState, useEffect, useRef } from "react";
 
const PIPELINE_STAGES = [
  {
    id: "import",
    icon: "📥",
    title: "Data Import",
    subtitle: "Count Matrix 준비 & 로딩",
    description: "RNA-seq 실험에서 얻은 유전자별 read count 데이터를 R로 불러옵니다. STAR, HISAT2 등 aligner의 output이나 featureCounts/HTSeq의 count matrix를 사용합니다.",
    analogy: "학생(샘플) × 과목(유전자) 성적표를 엑셀로 정리하는 단계예요. 각 칸에는 '이 학생이 이 과목에서 몇 점을 받았는지(몇 번 읽혔는지)'가 적혀 있습니다.",
    keyParams: [
      { name: "count_source", label: "Count 출처", default: "featureCounts", desc: "featureCounts / HTSeq / RSEM / Salmon" },
      { name: "min_count", label: "최소 count 기준", default: 10, desc: "전체 샘플에서 이 수 이상 발현된 유전자만" },
      { name: "min_samples", label: "최소 샘플 수", default: 3, desc: "N개 이상 샘플에서 발현되어야 유지" },
    ],
    interpretation: "로딩 후 유전자 수가 15,000~25,000이면 정상입니다. 너무 적으면 필터링이 과했거나 annotation 문제일 수 있어요.",
    tools: ["DESeq2", "edgeR"],
  },
  {
    id: "qc",
    icon: "🔍",
    title: "Sample-level QC",
    subtitle: "샘플 품질 확인 & 이상치 탐지",
    description: "PCA, 상관관계 히트맵, 라이브러리 크기 분포를 통해 샘플 간 품질을 평가하고 이상치(outlier)를 찾습니다.",
    analogy: "시험을 치른 학급에서 '혼자만 완전히 다른 패턴의 답안을 쓴 학생'이 있는지 확인하는 거예요. 실험 조건이 같은 replicate끼리는 비슷한 패턴을 보여야 정상이에요.",
    keyParams: [
      { name: "variance_filter", label: "분산 필터 (상위 %)", default: 500, desc: "PCA에 사용할 고분산 유전자 수" },
      { name: "cor_method", label: "상관관계 방법", default: "spearman", desc: "Pearson(선형) vs Spearman(순위)" },
      { name: "outlier_threshold", label: "이상치 기준 (상관계수)", default: 0.8, desc: "이 값 미만이면 이상치 의심" },
    ],
    interpretation: "PCA에서 같은 조건의 replicate가 모여 있고, 다른 조건과 분리되면 좋습니다. replicate 하나가 혼자 동떨어져 있다면 배치 효과나 실험 오류를 의심하세요.",
    tools: ["DESeq2", "edgeR"],
  },
  {
    id: "normalize",
    icon: "⚖️",
    title: "Normalization",
    subtitle: "라이브러리 크기 & 구성 보정",
    description: "샘플마다 sequencing depth가 다르고 RNA 구성도 다르므로, 공정한 비교를 위해 보정합니다. DESeq2와 edgeR는 서로 다른 정규화 방법을 사용합니다.",
    analogy: "A학교는 시험이 100문항, B학교는 50문항이에요. 원점수로 비교하면 불공정하죠? A학교 90점과 B학교 45점은 사실 같은 수준인데, 이걸 맞춰주는 게 normalization이에요.",
    keyParams: [
      { name: "deseq2_method", label: "DESeq2 정규화", default: "median-of-ratios", desc: "DESeq2 기본 방법 (size factor)" },
      { name: "edger_method", label: "edgeR 정규화", default: "TMM", desc: "Trimmed Mean of M-values" },
      { name: "vst_or_rlog", label: "변환 방법", default: "vst", desc: "vst(빠름) vs rlog(정확, 느림)" },
    ],
    interpretation: "정규화 전후 boxplot을 비교하세요. 정규화 후 모든 샘플의 분포가 비슷해져야 합니다. DESeq2의 median-of-ratios와 edgeR의 TMM은 결과가 비슷하지만 원리가 달라요.",
    tools: ["DESeq2", "edgeR"],
  },
  {
    id: "deg",
    icon: "📊",
    title: "Differential Expression",
    subtitle: "DESeq2 & edgeR 차등발현 분석",
    description: "두 조건 간에 통계적으로 유의하게 발현이 다른 유전자를 찾습니다. DESeq2와 edgeR 두 가지 방법으로 분석하여 결과를 비교합니다.",
    analogy: "A반(치료군)과 B반(대조군)의 과목별 평균 점수를 비교하는 거예요. '수학은 A반이 통계적으로 유의하게 높다'는 결론을 내리려면, 단순 평균 차이뿐 아니라 '그 차이가 우연일 확률(p-value)'도 계산해야 합니다.",
    keyParams: [
      { name: "contrast_group", label: "비교 조건", default: "Treatment vs Control", desc: "어떤 두 그룹을 비교할지" },
      { name: "padj_cutoff", label: "adj. p-value 기준", default: 0.05, desc: "다중비교 보정 후 유의수준" },
      { name: "logfc_cutoff", label: "|log2FC| 기준", default: 1, desc: "2배 이상 차이 (log2FC=1)" },
      { name: "shrinkage", label: "LFC shrinkage", default: "apeglm", desc: "DESeq2 fold-change 보정 방법" },
    ],
    interpretation: "DESeq2와 edgeR에서 공통으로 나온 DEG가 가장 신뢰할 수 있습니다. PDAC 연구에서는 adj.p < 0.05, |log2FC| > 1이 일반적이지만, 데이터에 따라 조정할 수 있어요.",
    tools: ["DESeq2", "edgeR"],
  },
  {
    id: "visualization",
    icon: "🎨",
    title: "시각화",
    subtitle: "Volcano, MA, Heatmap",
    description: "DEG 결과를 다양한 그래프로 시각화합니다. Volcano plot, MA plot, Heatmap은 논문 Figure로 필수적인 시각화입니다.",
    analogy: "시험 성적을 분석했으면 이제 그래프로 보기 좋게 정리하는 단계예요. 같은 데이터도 어떤 그래프로 그리느냐에 따라 전달하는 메시지가 달라집니다.",
    keyParams: [
      { name: "top_n_label", label: "라벨 표시 유전자 수", default: 20, desc: "Volcano plot에 이름 표시할 유전자" },
      { name: "heatmap_genes", label: "Heatmap 유전자 수", default: 50, desc: "상위 DEG N개를 heatmap으로" },
      { name: "color_scheme", label: "색상 테마", default: "RdBu", desc: "빨-파(RdBu) / 빨-초(RdYlGn)" },
    ],
    interpretation: "Volcano plot에서 오른쪽 위(up, significant)와 왼쪽 위(down, significant) 유전자에 주목하세요. Heatmap에서 샘플이 조건별로 잘 클러스터링되면 결과가 신뢰할 만합니다.",
    tools: ["ggplot2", "ComplexHeatmap", "EnhancedVolcano"],
  },
  {
    id: "pathway",
    icon: "🧭",
    title: "Pathway Analysis",
    subtitle: "GO / KEGG / GSEA",
    description: "DEG가 어떤 생물학적 경로(pathway)에 집중되어 있는지 분석합니다. 개별 유전자가 아닌 '유전자 세트' 수준에서 의미를 찾습니다.",
    analogy: "학생들의 과목 성적을 분석했는데, 수학·물리·화학이 모두 올랐다면 '이과 과목이 전반적으로 향상됐다'고 해석할 수 있죠. 개별 유전자(과목)보다 경로(이과/문과) 수준에서 보는 거예요.",
    keyParams: [
      { name: "go_ont", label: "GO 카테고리", default: "BP", desc: "BP(생물학적 과정) / MF / CC" },
      { name: "kegg_organism", label: "KEGG 종", default: "hsa", desc: "hsa(사람) / mmu(마우스)" },
      { name: "gsea_metric", label: "GSEA 랭킹 지표", default: "log2FC", desc: "유전자 순위 결정 기준" },
      { name: "pvalue_cutoff", label: "Pathway p-value", default: 0.05, desc: "유의한 pathway 기준" },
    ],
    interpretation: "ORA(Over-Representation Analysis)는 DEG 목록에서 특정 pathway가 과대표현되는지 봅니다. GSEA는 전체 유전자를 순위 매겨 분석하므로, 약한 신호도 잡아낼 수 있어 더 민감합니다. 논문에서는 보통 둘 다 제시합니다.",
    tools: ["clusterProfiler", "fgsea", "enrichplot"],
  },
];
 
const SYSTEM_PROMPT = `당신은 종양면역학 연구실의 전속 생물정보학(BI) 전문가입니다.
wet lab 연구자가 Bulk RNA-seq 분석을 배울 수 있도록, 인문계 학생에게 설명하듯 쉽고 친절하게 가르칩니다.
 
핵심 원칙:
1. 비유를 먼저 들어 개념을 설명
2. R 코드에는 반드시 한글 주석을 라인별로 달기
3. DESeq2와 edgeR 두 가지 방법을 병렬로 제시하고, 차이점과 각각의 장단점을 설명
4. wet lab 경험(qPCR, Western blot, organoid assay 등)과 연결하여 설명
5. 파라미터 선택의 근거를 항상 설명
6. 코드 실행 결과의 생물학적 해석까지 제공
 
연구 맥락:
- 췌장암(PDAC) 종양 미세환경 연구
- 주요 관심사: KRAS mutation, CAF subtype, NK cell 면역치료, FOLFIRINOX 반응
- 임상 샘플 기반 bulk RNA-seq (서울아산병원 협력)
- 실험 설계: 치료군 vs 대조군, KRAS subtype별 비교 등
 
응답 형식:
- 마크다운 형식으로 작성
- 코드 블록은 반드시 \`\`\`r 로 시작
- DESeq2 코드와 edgeR 코드를 나란히 제시할 때 ## DESeq2 방식 / ## edgeR 방식으로 구분
- 각 섹션을 ## 헤더로 구분
- 실행 가능한 완전한 코드 제공`;
 
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: "relative", margin: "12px 0" }}>
      <button onClick={handleCopy} style={{
        position: "absolute", top: 8, right: 8,
        background: copied ? "#166534" : "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)", color: "#d1d5db",
        borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", zIndex: 2
      }}>{copied ? "✓ 복사됨" : "복사"}</button>
      <pre style={{
        background: "#111827", color: "#e5e7eb", padding: 16, borderRadius: 10,
        overflowX: "auto", fontSize: 13, lineHeight: 1.65,
        border: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
      }}><code>{code}</code></pre>
    </div>
  );
}
 
function MarkdownRenderer({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0, key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```r") || line.startsWith("```R")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      elements.push(<CodeBlock key={key++} code={codeLines.join("\n")} />);
      i++;
    } else if (line.startsWith("### ")) {
      elements.push(<h4 key={key++} style={{ color: "#f9a8d4", margin: "18px 0 8px", fontSize: 15, fontWeight: 600 }}>{line.slice(4)}</h4>);
      i++;
    } else if (line.startsWith("## ")) {
      elements.push(<h3 key={key++} style={{ color: "#93c5fd", margin: "22px 0 10px", fontSize: 17, fontWeight: 700, borderBottom: "1px solid rgba(147,197,253,0.15)", paddingBottom: 6 }}>{line.slice(3)}</h3>);
      i++;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: 8, margin: "4px 0", paddingLeft: 8 }}>
          <span style={{ color: "#6b7280", flexShrink: 0 }}>•</span>
          <span style={{ color: "#d1d5db", fontSize: 14, lineHeight: 1.7 }}>{renderInline(line.slice(2))}</span>
        </div>
      );
      i++;
    } else if (line.startsWith("> ")) {
      elements.push(
        <div key={key++} style={{ borderLeft: "3px solid #a78bfa", paddingLeft: 14, margin: "10px 0", color: "#9ca3af", fontSize: 14, fontStyle: "italic", lineHeight: 1.7 }}>{line.slice(2)}</div>
      );
      i++;
    } else if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: 8 }} />);
      i++;
    } else {
      elements.push(<p key={key++} style={{ color: "#d1d5db", margin: "6px 0", fontSize: 14, lineHeight: 1.8 }}>{renderInline(line)}</p>);
      i++;
    }
  }
  return <>{elements}</>;
}
 
function renderInline(text) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`")
      ? <code key={i} style={{ background: "rgba(167,139,250,0.12)", color: "#c4b5fd", padding: "1px 5px", borderRadius: 4, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{part.slice(1, -1)}</code>
      : part
  );
}
 
function ParamControl({ param, value, onChange }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", background: "rgba(255,255,255,0.02)",
      borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600 }}>{param.label}</div>
        <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{param.desc}</div>
      </div>
      <input
        type={typeof param.default === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(typeof param.default === "number" ? Number(e.target.value) : e.target.value)}
        step={typeof param.default === "number" && param.default < 1 ? 0.01 : 1}
        style={{
          width: 120, padding: "6px 10px", background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
          color: "#c4b5fd", fontSize: 14, textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace", outline: "none"
        }}
      />
    </div>
  );
}
 
function ToolBadge({ name }) {
  const colors = {
    DESeq2: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", text: "#60a5fa" },
    edgeR: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", text: "#f87171" },
    ggplot2: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", text: "#4ade80" },
    ComplexHeatmap: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)", text: "#c084fc" },
    EnhancedVolcano: { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.3)", text: "#fb923c" },
    clusterProfiler: { bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.3)", text: "#2dd4bf" },
    fgsea: { bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.3)", text: "#f472b6" },
    enrichplot: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)", text: "#fbbf24" },
  };
  const c = colors[name] || { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.15)", text: "#9ca3af" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 12,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      fontSize: 11, fontWeight: 600, marginRight: 4
    }}>{name}</span>
  );
}
 
export default function BulkRNAseqApp() {
  const [selectedStage, setSelectedStage] = useState(0);
  const [params, setParams] = useState({});
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [comparisonMode, setComparisonMode] = useState("both");
 
  const stage = PIPELINE_STAGES[selectedStage];
 
  useEffect(() => {
    const defaults = {};
    stage.keyParams.forEach((p) => { defaults[p.name] = p.default; });
    setParams(defaults);
    setAiResponse("");
    setChatHistory([]);
  }, [selectedStage]);
 
  const generateCode = async () => {
    setLoading(true);
    setAiResponse("");
    const paramStr = stage.keyParams.map((p) => `${p.label}: ${params[p.name]}`).join(", ");
    const modeStr = comparisonMode === "both" ? "DESeq2와 edgeR 두 가지 방법을 병렬로 제시하고 비교해주세요" :
      comparisonMode === "deseq2" ? "DESeq2 중심으로 설명해주세요" : "edgeR 중심으로 설명해주세요";
 
    const prompt = `"${stage.title}" 단계에 대해 3-Layer 원칙으로 설명해주세요.
${modeStr}
 
현재 설정된 파라미터: ${paramStr}
 
다음 구조로 작성해주세요:
## 🎯 개념 (What & Why)
비유를 활용한 쉬운 설명. Bulk RNA-seq 특유의 개념(replicate, batch effect 등)을 포함.
 
## 💻 코드 (How)
${comparisonMode === "both" ? "### DESeq2 방식\n(DESeq2 코드)\n\n### edgeR 방식\n(edgeR 코드)\n\n### 🔄 두 방법 비교\n차이점과 각각 언제 쓰면 좋은지" : "위 파라미터를 반영한 완전한 R 코드 (한글 주석 포함)"}
 
## 🔬 해석 (So What)
결과물을 어떻게 읽고, 다음 단계로 어떻게 연결하는지
 
## 🧪 Wet Lab 연결
이 분석 결과를 qPCR validation, Western blot, 오가노이드 실험 등과 어떻게 연결할 수 있는지`;
 
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((c) => c.text || "").join("") || "응답을 생성할 수 없습니다.";
      setAiResponse(text);
      setChatHistory([{ role: "user", content: prompt }, { role: "assistant", content: text }]);
    } catch (err) {
      setAiResponse("⚠️ API 호출 중 오류가 발생했습니다: " + err.message);
    }
    setLoading(false);
  };
 
  const askFollowUp = async () => {
    if (!customQuestion.trim() || loading) return;
    setLoading(true);
    const newHistory = [...chatHistory, { role: "user", content: customQuestion }];
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: newHistory,
        }),
      });
      const data = await response.json();
      const text = data.content?.map((c) => c.text || "").join("") || "";
      setAiResponse(text);
      setChatHistory([...newHistory, { role: "assistant", content: text }]);
      setCustomQuestion("");
    } catch (err) { setAiResponse("⚠️ 오류: " + err.message); }
    setLoading(false);
  };
 
  const quickQuestions = [
    "DESeq2와 edgeR 결과가 다를 때 어떻게 해석해?",
    "PDAC 데이터에서 배치 효과 보정 방법은?",
    "이 결과를 논문 Figure로 만드는 코드를 줘",
    "KRAS subtype별 비교 분석은 어떻게 설계해?",
    "qPCR validation 후보 유전자 선정 기준은?",
  ];
 
  return (
    <div style={{
      display: "flex", height: "100vh",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      background: "#0c0a1a", color: "#e5e7eb", overflow: "hidden"
    }}>
      {/* Sidebar */}
      <div style={{
        width: 270, background: "linear-gradient(180deg, #0f0d1f 0%, #0c0a1a 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", flexShrink: 0
      }}>
        <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "#fff"
            }}>B</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", letterSpacing: "-0.03em" }}>Bulk RNA-seq Lab</div>
              <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>DESeq2 + edgeR Pipeline</div>
            </div>
          </div>
        </div>
 
        {/* Tool Toggle */}
        <div style={{ padding: "12px 14px 6px" }}>
          <div style={{ fontSize: 10, color: "#4b5563", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            분석 도구 선택
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3 }}>
            {[["both", "DESeq2 + edgeR"], ["deseq2", "DESeq2"], ["edger", "edgeR"]].map(([val, label]) => (
              <button key={val} onClick={() => setComparisonMode(val)} style={{
                flex: 1, padding: "6px 4px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
                background: comparisonMode === val ? "rgba(167,139,250,0.2)" : "transparent",
                color: comparisonMode === val ? "#c4b5fd" : "#6b7280",
              }}>{label}</button>
            ))}
          </div>
        </div>
 
        {/* Pipeline Steps */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: "#4b5563", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 8px 4px" }}>
            Analysis Pipeline
          </div>
          {PIPELINE_STAGES.map((s, i) => (
            <button key={s.id} onClick={() => setSelectedStage(i)} style={{
              width: "100%", display: "flex", alignItems: "flex-start", gap: 10,
              padding: "10px 12px", marginBottom: 3, borderRadius: 8,
              background: selectedStage === i ? "rgba(167,139,250,0.08)" : "transparent",
              border: selectedStage === i ? "1px solid rgba(167,139,250,0.2)" : "1px solid transparent",
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              color: selectedStage === i ? "#c4b5fd" : "#9ca3af"
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: selectedStage === i ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14
              }}>{s.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: selectedStage === i ? 600 : 500 }}>{s.title}</div>
                <div style={{ fontSize: 10, color: "#4b5563", marginTop: 2 }}>{s.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
 
        <div style={{
          padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 10, color: "#374151", textAlign: "center", lineHeight: 1.5
        }}>
          Powered by Claude API<br />Tumor Immunology Lab
        </div>
      </div>
 
      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>{stage.icon}</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f3f4f6", margin: 0, letterSpacing: "-0.03em" }}>
                Step {selectedStage + 1}. {stage.title}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>{stage.subtitle}</span>
                <span style={{ color: "#374151" }}>|</span>
                {stage.tools.map((t) => <ToolBadge key={t} name={t} />)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
            {PIPELINE_STAGES.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= selectedStage ? "linear-gradient(90deg, #7c3aed, #a78bfa)" : "rgba(255,255,255,0.06)",
              }} />
            ))}
          </div>
        </div>
 
        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {/* Concept Card */}
          <div style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(167,139,250,0.03))",
            border: "1px solid rgba(167,139,250,0.12)", borderRadius: 14, padding: "18px 20px", marginBottom: 20
          }}>
            <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>💡 핵심 개념</div>
            <p style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.8, margin: "0 0 10px" }}>{stage.description}</p>
            <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "12px 16px", borderLeft: "3px solid #a78bfa" }}>
              <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600, marginBottom: 4 }}>🎯 비유</div>
              <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{stage.analogy}</p>
            </div>
          </div>
 
          {/* DESeq2 vs edgeR comparison card - only for relevant stages */}
          {(stage.id === "normalize" || stage.id === "deg") && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20
            }}>
              <div style={{
                background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)",
                borderRadius: 12, padding: "14px 16px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <ToolBadge name="DESeq2" />
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Bioconductor</span>
                </div>
                <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, margin: 0 }}>
                  {stage.id === "normalize"
                    ? "Median-of-ratios 방법. 모든 유전자의 기하평균 대비 비율의 중앙값으로 size factor를 계산. 소수의 고발현 유전자에 덜 민감."
                    : "음이항 분포(Negative Binomial) + Wald test. 샘플 수가 적어도(3 vs 3) 안정적. LFC shrinkage로 과추정 방지."}
                </p>
              </div>
              <div style={{
                background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: 12, padding: "14px 16px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <ToolBadge name="edgeR" />
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Bioconductor</span>
                </div>
                <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, margin: 0 }}>
                  {stage.id === "normalize"
                    ? "TMM (Trimmed Mean of M-values). 극단적인 발현 유전자를 trim한 후 나머지로 정규화 factor 계산. 구성적 차이(composition bias)에 강건."
                    : "음이항 분포 + quasi-likelihood F-test. 분산 추정이 더 유연하고, 복잡한 실험 설계(다중 요인)에 강점. glmQLFit/glmQLFTest 사용."}
                </p>
              </div>
            </div>
          )}
 
          {/* Params */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: "18px 20px", marginBottom: 20
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>⚙️ 파라미터 설정</div>
              <button onClick={() => {
                const d = {}; stage.keyParams.forEach((p) => { d[p.name] = p.default; }); setParams(d);
              }} style={{
                background: "none", border: "1px solid rgba(255,255,255,0.1)",
                color: "#6b7280", fontSize: 11, padding: "3px 10px", borderRadius: 5, cursor: "pointer"
              }}>기본값 복원</button>
            </div>
            {stage.keyParams.map((p) => (
              <ParamControl key={p.name} param={p} value={params[p.name] ?? p.default}
                onChange={(v) => setParams({ ...params, [p.name]: v })} />
            ))}
          </div>
 
          {/* Generate */}
          <button onClick={generateCode} disabled={loading} style={{
            width: "100%", padding: "14px", borderRadius: 12,
            background: loading ? "rgba(167,139,250,0.1)" : "linear-gradient(135deg, #7c3aed, #8b5cf6)",
            border: "none", color: loading ? "#a78bfa" : "#fff",
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 20, letterSpacing: "-0.01em"
          }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #a78bfa", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                AI가 분석 가이드를 생성하는 중...
              </span>
            ) : (
              `🧬 3-Layer 분석 가이드 생성 (${comparisonMode === "both" ? "DESeq2 + edgeR 비교" : comparisonMode === "deseq2" ? "DESeq2" : "edgeR"})`
            )}
          </button>
 
          {/* AI Response */}
          {aiResponse && (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14, padding: "20px 22px", marginBottom: 20
            }}>
              <div style={{ fontSize: 12, color: "#93c5fd", fontWeight: 600, marginBottom: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>🤖 AI 분석 가이드</div>
              <MarkdownRenderer text={aiResponse} />
            </div>
          )}
 
          {/* Follow-up */}
          {aiResponse && (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14, padding: "18px 20px", marginBottom: 20
            }}>
              <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 12, letterSpacing: "0.04em", textTransform: "uppercase" }}>💬 추가 질문</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {quickQuestions.map((q, i) => (
                  <button key={i} onClick={() => setCustomQuestion(q)} style={{
                    background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)",
                    color: "#c4b5fd", fontSize: 12, padding: "6px 12px",
                    borderRadius: 20, cursor: "pointer"
                  }}>{q}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askFollowUp()}
                  placeholder="궁금한 점을 자유롭게 물어보세요..."
                  style={{
                    flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                    color: "#e5e7eb", fontSize: 13, outline: "none",
                    fontFamily: "'Pretendard', sans-serif"
                  }} />
                <button onClick={askFollowUp} disabled={loading || !customQuestion.trim()} style={{
                  padding: "10px 18px",
                  background: customQuestion.trim() ? "#7c3aed" : "rgba(255,255,255,0.03)",
                  border: "none", borderRadius: 10,
                  color: customQuestion.trim() ? "#fff" : "#4b5563",
                  fontSize: 13, fontWeight: 600,
                  cursor: customQuestion.trim() ? "pointer" : "not-allowed"
                }}>전송</button>
              </div>
            </div>
          )}
 
          {/* Interpretation */}
          <div style={{
            background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)",
            borderRadius: 14, padding: "16px 20px", marginBottom: 20
          }}>
            <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600, marginBottom: 6 }}>📋 해석 가이드</div>
            <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7, margin: 0 }}>{stage.interpretation}</p>
          </div>
 
          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 30 }}>
            <button onClick={() => selectedStage > 0 && setSelectedStage(selectedStage - 1)}
              disabled={selectedStage === 0} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, cursor: selectedStage > 0 ? "pointer" : "default",
                background: selectedStage > 0 ? "rgba(255,255,255,0.04)" : "transparent",
                border: selectedStage > 0 ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                color: selectedStage > 0 ? "#9ca3af" : "#1f2937",
              }}>← 이전 단계</button>
            <button onClick={() => selectedStage < PIPELINE_STAGES.length - 1 && setSelectedStage(selectedStage + 1)}
              disabled={selectedStage === PIPELINE_STAGES.length - 1} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13,
                cursor: selectedStage < PIPELINE_STAGES.length - 1 ? "pointer" : "default",
                background: selectedStage < PIPELINE_STAGES.length - 1 ? "rgba(167,139,250,0.08)" : "transparent",
                border: selectedStage < PIPELINE_STAGES.length - 1 ? "1px solid rgba(167,139,250,0.15)" : "1px solid transparent",
                color: selectedStage < PIPELINE_STAGES.length - 1 ? "#c4b5fd" : "#1f2937",
              }}>다음 단계 →</button>
          </div>
        </div>
      </div>
 
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
        input:focus { border-color: rgba(167,139,250,0.3) !important; }
      `}</style>
    </div>
  );
}
 
