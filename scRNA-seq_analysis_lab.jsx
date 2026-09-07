

Bi analysis lab · JSX
import { useState, useEffect, useRef } from "react";
 
const PIPELINE_STAGES = [
  {
    id: "qc",
    icon: "🔍",
    title: "Quality Control",
    subtitle: "데이터 품질 확인 & 필터링",
    description: "세포와 유전자의 품질을 평가하고, 분석에 부적합한 세포를 제거합니다.",
    analogy: "설문조사에서 불성실 응답(전부 1번만 체크한 사람)을 걸러내는 것과 같아요. 죽은 세포나 빈 droplet이 섞여 있으면 전체 분석 결과가 왜곡되거든요.",
    keyParams: [
      { name: "min_features", label: "최소 유전자 수", default: 200, desc: "이 수 미만 → 빈 droplet 의심" },
      { name: "max_features", label: "최대 유전자 수", default: 5000, desc: "이 수 초과 → doublet 의심" },
      { name: "max_mt_percent", label: "최대 미토콘드리아 %", default: 15, desc: "높을수록 죽어가는 세포" },
    ],
    interpretation: "필터링 전후 세포 수를 비교하세요. 30% 이상 제거됐다면 기준 완화를 고려하고, 거의 안 제거됐다면 데이터 품질이 좋다는 뜻입니다.",
  },
  {
    id: "normalize",
    icon: "⚖️",
    title: "Normalization",
    subtitle: "세포 간 발현량 보정",
    description: "각 세포가 캡처한 총 RNA 양이 다르므로, 공정한 비교를 위해 보정합니다.",
    analogy: "시험 난이도가 다른 A반과 B반의 점수를 비교하려면, 원점수가 아니라 표준점수로 변환해야 공정하죠? Normalization이 바로 이 표준점수 변환이에요.",
    keyParams: [
      { name: "norm_method", label: "정규화 방법", default: "LogNormalize", desc: "가장 표준적인 방법" },
      { name: "scale_factor", label: "스케일 팩터", default: 10000, desc: "보정 기준값" },
      { name: "n_variable_features", label: "변동 유전자 수", default: 2000, desc: "분석에 사용할 유전자 수" },
    ],
    interpretation: "Variable Feature Plot에서 빨간 점이 선택된 유전자입니다. 면역 마커(CD3, CD8A 등)나 CAF 마커(ACTA2, FAP)가 포함되어 있는지 확인하세요.",
  },
  {
    id: "dimreduc",
    icon: "🗺️",
    title: "차원 축소 & 시각화",
    subtitle: "PCA → UMAP/tSNE",
    description: "수만 개 유전자 차원을 2D로 압축하여 세포 간 관계를 시각화합니다.",
    analogy: "서울 지하철 노선도를 떠올려보세요. 실제 지리적 위치와는 다르지만, 역들 간의 '관계'(어디서 환승하는지)는 정확히 보여주죠. UMAP도 마찬가지로 세포 간의 '유사도 관계'를 2D로 보여주는 지도예요.",
    keyParams: [
      { name: "n_pcs", label: "사용할 PC 수", default: 30, desc: "ElbowPlot 보고 결정" },
      { name: "umap_dims", label: "UMAP 입력 차원", default: 30, desc: "보통 PC 수와 동일" },
      { name: "n_neighbors", label: "UMAP neighbors", default: 30, desc: "높을수록 글로벌 구조 강조" },
    ],
    interpretation: "ElbowPlot에서 '팔꿈치'가 꺾이는 지점의 PC 수를 선택하세요. 보통 PDAC 데이터에서는 15~30 PC가 적절합니다.",
  },
  {
    id: "cluster",
    icon: "🫧",
    title: "Clustering",
    subtitle: "세포 그룹 분류",
    description: "유사한 발현 패턴을 가진 세포들을 자동으로 그룹화합니다.",
    analogy: "카페에서 자연스럽게 취미가 비슷한 사람끼리 테이블이 형성되는 것과 같아요. 알고리즘이 유전자 발현 패턴이 비슷한 세포끼리 자동으로 묶어줍니다.",
    keyParams: [
      { name: "resolution", label: "Resolution", default: 0.8, desc: "높을수록 클러스터 많아짐 (PDAC TME: 0.5~1.0)" },
      { name: "algorithm", label: "알고리즘", default: "Louvain", desc: "Louvain(기본) vs Leiden(더 정확)" },
    ],
    interpretation: "Resolution이 너무 높으면 over-clustering(하나의 세포 타입이 여러 개로 쪼개짐), 너무 낮으면 under-clustering(다른 세포 타입이 합쳐짐)이 발생합니다. 여러 resolution을 시도해보세요.",
  },
  {
    id: "annotation",
    icon: "🏷️",
    title: "Cell Type Annotation",
    subtitle: "세포 타입 주석 달기",
    description: "각 클러스터가 어떤 세포 타입인지 마커 유전자를 기반으로 판별합니다.",
    analogy: "FACS에서 CD3+CD8+ 세포를 'cytotoxic T cell'로 판별하는 것과 같은 원리예요. 다만 여기선 수십~수백 개 유전자 발현 패턴을 종합적으로 봅니다.",
    keyParams: [
      { name: "test_method", label: "DEG 검정법", default: "wilcox", desc: "Wilcoxon rank-sum (가장 범용)" },
      { name: "min_pct", label: "최소 발현 비율", default: 0.25, desc: "최소 25% 세포에서 발현" },
      { name: "logfc_threshold", label: "최소 logFC", default: 0.25, desc: "발현 차이 최소 기준" },
    ],
    interpretation: "FindAllMarkers 결과에서 각 클러스터의 top 마커를 확인하세요. PDAC TME 주요 마커: T cell(CD3D, CD8A), NK(NKG7, GNLY), CAF(ACTA2, FAP, PDGFRA), Epithelial(EPCAM, KRT19)",
  },
  {
    id: "deg",
    icon: "📊",
    title: "Differential Expression",
    subtitle: "조건 간 차등발현 분석",
    description: "두 조건(예: 치료 vs 대조) 간에 유의하게 발현이 다른 유전자를 찾습니다.",
    analogy: "A반과 B반의 과목별 평균 성적을 비교하는 거예요. 수학은 A반이 월등히 높고, 영어는 비슷하다면 → 수학이 '차등발현 유전자'인 셈이죠.",
    keyParams: [
      { name: "test_use", label: "통계 검정법", default: "MAST", desc: "scRNA-seq 특화 검정" },
      { name: "min_pct", label: "최소 발현 비율", default: 0.1, desc: "둘 중 하나에서 10% 이상 발현" },
      { name: "logfc_threshold", label: "logFC 기준", default: 0.5, desc: "2배 이상 차이" },
    ],
    interpretation: "Volcano plot에서 오른쪽 위(upregulated, significant)와 왼쪽 위(downregulated, significant)에 있는 유전자에 주목하세요. adj. p-value < 0.05 & |logFC| > 0.5가 일반적인 기준입니다.",
  },
];
 
const SYSTEM_PROMPT = `당신은 종양면역학 연구실의 전속 생물정보학(BI) 전문가입니다. 
wet lab 연구자가 bioinformatics를 배울 수 있도록, 인문계 학생에게 설명하듯 쉽고 친절하게 가르칩니다.
 
핵심 원칙:
1. 비유를 먼저 들어 개념을 설명
2. R 코드에는 반드시 한글 주석을 라인별로 달기
3. wet lab 경험(flow cytometry, organoid 등)과 연결하여 설명
4. 파라미터 선택의 근거를 항상 설명
5. 코드 실행 결과의 생물학적 해석까지 제공
 
연구 맥락:
- 췌장암(PDAC) 종양 미세환경 연구
- 공배양 시스템: 췌장암 오가노이드 + NK cell + CAF + HUVEC
- Seurat v5 기반 scRNA-seq 분석
- 주요 관심사: CAF subtype (myCAF, iCAF, apCAF), NK cell 기능, KRAS mutation
 
응답 형식:
- 마크다운 형식으로 작성
- 코드 블록은 반드시 \`\`\`r 로 시작
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
      <button
        onClick={handleCopy}
        style={{
          position: "absolute", top: 8, right: 8,
          background: copied ? "#2d6a4f" : "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#e0e0e0", borderRadius: 6, padding: "4px 10px",
          fontSize: 12, cursor: "pointer", zIndex: 2,
          transition: "all 0.2s"
        }}
      >
        {copied ? "✓ 복사됨" : "복사"}
      </button>
      <pre style={{
        background: "#1a1b26", color: "#c0caf5", padding: "16px 16px 16px 16px",
        borderRadius: 10, overflowX: "auto", fontSize: 13, lineHeight: 1.6,
        border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
 
function MarkdownRenderer({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  let key = 0;
 
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```r") || line.startsWith("```R")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(<CodeBlock key={key++} code={codeLines.join("\n")} />);
      i++;
    } else if (line.startsWith("### ")) {
      elements.push(<h4 key={key++} style={{ color: "#5eead4", margin: "18px 0 8px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{line.slice(4)}</h4>);
      i++;
    } else if (line.startsWith("## ")) {
      elements.push(<h3 key={key++} style={{ color: "#7dd3fc", margin: "22px 0 10px", fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", borderBottom: "1px solid rgba(125,211,252,0.15)", paddingBottom: 6 }}>{line.slice(3)}</h3>);
      i++;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: 8, margin: "4px 0", paddingLeft: 8 }}>
          <span style={{ color: "#94a3b8", flexShrink: 0 }}>•</span>
          <span style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.7 }}>{renderInlineCode(line.slice(2))}</span>
        </div>
      );
      i++;
    } else if (line.startsWith("> ")) {
      elements.push(
        <div key={key++} style={{
          borderLeft: "3px solid #5eead4", paddingLeft: 14, margin: "10px 0",
          color: "#94a3b8", fontSize: 14, fontStyle: "italic", lineHeight: 1.7
        }}>{line.slice(2)}</div>
      );
      i++;
    } else if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: 8 }} />);
      i++;
    } else {
      elements.push(<p key={key++} style={{ color: "#cbd5e1", margin: "6px 0", fontSize: 14, lineHeight: 1.8 }}>{renderInlineCode(line)}</p>);
      i++;
    }
  }
  return <>{elements}</>;
}
 
function renderInlineCode(text) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) =>
    part.startsWith("`") && part.endsWith("`")
      ? <code key={i} style={{ background: "rgba(94,234,212,0.1)", color: "#5eead4", padding: "1px 5px", borderRadius: 4, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{part.slice(1, -1)}</code>
      : part
  );
}
 
function ParamControl({ param, value, onChange }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", background: "rgba(255,255,255,0.03)",
      borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)",
      marginBottom: 8
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{param.label}</div>
        <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{param.desc}</div>
      </div>
      <input
        type={typeof param.default === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(typeof param.default === "number" ? Number(e.target.value) : e.target.value)}
        style={{
          width: 90, padding: "6px 10px", background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
          color: "#5eead4", fontSize: 14, textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace", outline: "none"
        }}
      />
    </div>
  );
}
 
export default function BIAnalysisApp() {
  const [selectedStage, setSelectedStage] = useState(0);
  const [params, setParams] = useState({});
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("concept");
  const [customQuestion, setCustomQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const responseRef = useRef(null);
 
  const stage = PIPELINE_STAGES[selectedStage];
 
  useEffect(() => {
    const defaults = {};
    stage.keyParams.forEach((p) => { defaults[p.name] = p.default; });
    setParams(defaults);
    setAiResponse("");
    setChatHistory([]);
    setActiveTab("concept");
  }, [selectedStage]);
 
  const generateCode = async () => {
    setLoading(true);
    setAiResponse("");
    const paramStr = stage.keyParams.map((p) => `${p.label}: ${params[p.name]}`).join(", ");
    const prompt = `"${stage.title}" 단계에 대해 3-Layer 원칙으로 설명해주세요.
 
현재 설정된 파라미터: ${paramStr}
 
다음 구조로 작성해주세요:
## 🎯 개념 (What & Why)
비유를 활용한 쉬운 설명
 
## 💻 코드 (How)  
위 파라미터를 반영한 완전한 R 코드 (Seurat v5 기준, 한글 주석 포함)
 
## 🔬 해석 (So What)
결과물을 어떻게 읽고, 다음 단계로 어떻게 연결하는지
 
## 🧪 Wet Lab 연결
이 분석 결과를 wet lab 실험(flow cytometry, organoid assay 등)과 어떻게 연결할 수 있는지`;
 
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
      setActiveTab("result");
      setChatHistory([
        { role: "user", content: prompt },
        { role: "assistant", content: text },
      ]);
    } catch (err) {
      setAiResponse("⚠️ API 호출 중 오류가 발생했습니다: " + err.message);
    }
    setLoading(false);
  };
 
  const askFollowUp = async () => {
    if (!customQuestion.trim() || loading) return;
    setLoading(true);
    const newHistory = [
      ...chatHistory,
      { role: "user", content: customQuestion },
    ];
 
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
    } catch (err) {
      setAiResponse("⚠️ 오류: " + err.message);
    }
    setLoading(false);
  };
 
  const quickQuestions = [
    "이 단계에서 자주 발생하는 에러와 해결법은?",
    "PDAC 데이터에 최적화된 파라미터를 추천해줘",
    "이 결과를 논문 Figure로 만드는 코드를 줘",
    "공배양 데이터에서 이 단계의 주의점은?",
  ];
 
  return (
    <div style={{
      display: "flex", height: "100vh", fontFamily: "'Pretendard', -apple-system, sans-serif",
      background: "#0f172a", color: "#e2e8f0", overflow: "hidden"
    }}>
      {/* Sidebar */}
      <div style={{
        width: 260, background: "#0f172a", borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden"
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #0d9488, #5eead4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, color: "#0f172a"
            }}>S</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.03em" }}>scRNA-seq Lab</div>
              <div style={{ fontSize: 10, color: "#5eead4", fontWeight: 500, letterSpacing: "0.05em" }}>scRNA-seq pipeline</div>
            </div>
          </div>
        </div>
 
        {/* Pipeline Steps */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 8px", marginBottom: 6 }}>
            Analysis Pipeline
          </div>
          {PIPELINE_STAGES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSelectedStage(i)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", marginBottom: 3, borderRadius: 8,
                background: selectedStage === i ? "rgba(94,234,212,0.08)" : "transparent",
                border: selectedStage === i ? "1px solid rgba(94,234,212,0.2)" : "1px solid transparent",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                color: selectedStage === i ? "#5eead4" : "#94a3b8"
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: selectedStage === i ? "rgba(94,234,212,0.15)" : "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, flexShrink: 0
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: selectedStage === i ? 600 : 500 }}>{s.title}</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{s.subtitle}</div>
              </div>
              {selectedStage === i && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#5eead4", flexShrink: 0 }} />}
            </button>
          ))}
        </div>
 
        {/* Footer */}
        <div style={{
          padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 10, color: "#334155", textAlign: "center", lineHeight: 1.5
        }}>
          Powered by Claude API<br />Tumor Immunology Lab
        </div>
      </div>
 
      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.01)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>{stage.icon}</span>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0, letterSpacing: "-0.03em" }}>
                Step {selectedStage + 1}. {stage.title}
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: "3px 0 0" }}>{stage.subtitle}</p>
            </div>
          </div>
          {/* Progress */}
          <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
            {PIPELINE_STAGES.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= selectedStage ? "linear-gradient(90deg, #0d9488, #5eead4)" : "rgba(255,255,255,0.06)",
                transition: "all 0.3s"
              }} />
            ))}
          </div>
        </div>
 
        {/* Content Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }} ref={responseRef}>
          {/* Concept Card */}
          <div style={{
            background: "linear-gradient(135deg, rgba(13,148,136,0.08), rgba(94,234,212,0.04))",
            border: "1px solid rgba(94,234,212,0.12)", borderRadius: 14, padding: "18px 20px",
            marginBottom: 20
          }}>
            <div style={{ fontSize: 12, color: "#5eead4", fontWeight: 600, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              💡 핵심 개념
            </div>
            <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, margin: "0 0 10px" }}>{stage.description}</p>
            <div style={{
              background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 16px",
              borderLeft: "3px solid #5eead4"
            }}>
              <div style={{ fontSize: 11, color: "#5eead4", fontWeight: 600, marginBottom: 4 }}>🎯 비유</div>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{stage.analogy}</p>
            </div>
          </div>
 
          {/* Parameters */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: "18px 20px", marginBottom: 20
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                ⚙️ 파라미터 설정
              </div>
              <button
                onClick={() => {
                  const defaults = {};
                  stage.keyParams.forEach((p) => { defaults[p.name] = p.default; });
                  setParams(defaults);
                }}
                style={{
                  background: "none", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#64748b", fontSize: 11, padding: "3px 10px",
                  borderRadius: 5, cursor: "pointer"
                }}
              >기본값 복원</button>
            </div>
            {stage.keyParams.map((p) => (
              <ParamControl
                key={p.name} param={p} value={params[p.name] ?? p.default}
                onChange={(v) => setParams({ ...params, [p.name]: v })}
              />
            ))}
          </div>
 
          {/* Generate Button */}
          <button
            onClick={generateCode}
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              background: loading
                ? "rgba(94,234,212,0.1)"
                : "linear-gradient(135deg, #0d9488, #14b8a6)",
              border: "none", color: loading ? "#5eead4" : "#0f172a",
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              marginBottom: 20, transition: "all 0.2s",
              letterSpacing: "-0.01em"
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #5eead4", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                AI가 분석 가이드를 생성하는 중...
              </span>
            ) : (
              "🧬 3-Layer 분석 가이드 생성"
            )}
          </button>
 
          {/* AI Response */}
          {aiResponse && (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14, padding: "20px 22px", marginBottom: 20
            }}>
              <div style={{ fontSize: 12, color: "#7dd3fc", fontWeight: 600, marginBottom: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                🤖 AI 분석 가이드
              </div>
              <MarkdownRenderer text={aiResponse} />
            </div>
          )}
 
          {/* Follow-up */}
          {aiResponse && (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14, padding: "18px 20px", marginBottom: 20
            }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 12, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                💬 추가 질문
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setCustomQuestion(q); }}
                    style={{
                      background: "rgba(94,234,212,0.06)", border: "1px solid rgba(94,234,212,0.15)",
                      color: "#5eead4", fontSize: 12, padding: "6px 12px",
                      borderRadius: 20, cursor: "pointer", transition: "all 0.15s"
                    }}
                  >{q}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askFollowUp()}
                  placeholder="궁금한 점을 자유롭게 물어보세요..."
                  style={{
                    flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                    color: "#e2e8f0", fontSize: 13, outline: "none",
                    fontFamily: "'Pretendard', sans-serif"
                  }}
                />
                <button
                  onClick={askFollowUp}
                  disabled={loading || !customQuestion.trim()}
                  style={{
                    padding: "10px 18px", background: customQuestion.trim() ? "#0d9488" : "rgba(255,255,255,0.04)",
                    border: "none", borderRadius: 10, color: customQuestion.trim() ? "#0f172a" : "#475569",
                    fontSize: 13, fontWeight: 600, cursor: customQuestion.trim() ? "pointer" : "not-allowed"
                  }}
                >전송</button>
              </div>
            </div>
          )}
 
          {/* Interpretation Card */}
          <div style={{
            background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)",
            borderRadius: 14, padding: "16px 20px", marginBottom: 20
          }}>
            <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600, marginBottom: 6, letterSpacing: "0.04em" }}>
              📋 해석 가이드
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>{stage.interpretation}</p>
          </div>
 
          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 30 }}>
            <button
              onClick={() => selectedStage > 0 && setSelectedStage(selectedStage - 1)}
              disabled={selectedStage === 0}
              style={{
                padding: "10px 20px", background: selectedStage > 0 ? "rgba(255,255,255,0.04)" : "transparent",
                border: selectedStage > 0 ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                borderRadius: 10, color: selectedStage > 0 ? "#94a3b8" : "#1e293b",
                fontSize: 13, cursor: selectedStage > 0 ? "pointer" : "default"
              }}
            >← 이전 단계</button>
            <button
              onClick={() => selectedStage < PIPELINE_STAGES.length - 1 && setSelectedStage(selectedStage + 1)}
              disabled={selectedStage === PIPELINE_STAGES.length - 1}
              style={{
                padding: "10px 20px",
                background: selectedStage < PIPELINE_STAGES.length - 1 ? "rgba(94,234,212,0.08)" : "transparent",
                border: selectedStage < PIPELINE_STAGES.length - 1 ? "1px solid rgba(94,234,212,0.15)" : "1px solid transparent",
                borderRadius: 10, color: selectedStage < PIPELINE_STAGES.length - 1 ? "#5eead4" : "#1e293b",
                fontSize: 13, cursor: selectedStage < PIPELINE_STAGES.length - 1 ? "pointer" : "default"
              }}
            >다음 단계 →</button>
          </div>
        </div>
      </div>
 
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        input:focus { border-color: rgba(94,234,212,0.3) !important; }
      `}</style>
    </div>
  );
}
 
